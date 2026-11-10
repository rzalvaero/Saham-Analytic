# -*- coding: utf-8 -*-
"""
sync_agent.py — MT5 Live Sync Bridge ke trade.reez.my.id
Membaca posisi aktif dan riwayat MT5 (Exness Cent IDC) secara berkala
lalu mengirimkannya via POST ke https://trade.reez.my.id/api/trade-live/sync.

Jalankan di background pada PC/VPS trading ini agar website selalu live!
"""
import json
import os
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone

try:
    import MetaTrader5 as mt5
except ImportError:
    print("Error: MetaTrader5 library tidak ditemukan. Pastikan package terinstal.")
    sys.exit(1)

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

SYNC_URL = os.environ.get("SYNC_URL", "https://trade.reez.my.id/api/trade-live/sync")
SYNC_SECRET = os.environ.get("SYNC_SECRET", "reez_mt5_secret_2026")
INTERVAL_SEC = float(os.environ.get("SYNC_INTERVAL", 2.5))

WIB = timezone(timedelta(hours=7))

MAGIC_NAMES = {
    778899: "🪙 ReyFX-BTC",
    667788: "🛡️ ReyFX-M15 (Breakout)",
    1544332: "⚡ ReyFX-M15 (EMA 44/332)",
    667799: "🤖 ReyFX-M5 (Scalper)",
    123456: "📰 ReyFX-NewsStop",
    0: "👤 Manual Trade",
}

class MT5LiveSync:
    def __init__(self):
        self.connected = False
        self.last_stats_calc = 0
        self.cached_stats = {}
        self.cached_history = []

    def ensure_connection(self):
        if not self.connected:
            self.connected = mt5.initialize()
            if self.connected:
                acc = mt5.account_info()
                print(f"[{datetime.now(WIB).strftime('%H:%M:%S')}] ✅ MT5 Connected: Login {acc.login if acc else 'N/A'}")
            else:
                print(f"[{datetime.now(WIB).strftime('%H:%M:%S')}] ⚠️ Gagal inisialisasi MT5, retry dalam 5s...")
        return self.connected

    def collect_live_snapshot(self):
        if not self.ensure_connection():
            return None

        now = time.time()
        try:
            acc = mt5.account_info()
            if not acc:
                self.connected = False
                return None

            positions = mt5.positions_get()
            pos_list = []
            total_floating_idc = 0.0

            if positions:
                for p in positions:
                    pos_type = "BUY" if p.type == 0 else "SELL"
                    pnl_idc = p.profit + getattr(p, "swap", 0.0)
                    total_floating_idc += pnl_idc
                    magic = getattr(p, "magic", 0)
                    strat_name = MAGIC_NAMES.get(magic, f"Strategi #{magic}" if magic != 0 else "👤 Manual Trade")

                    open_dt = datetime.fromtimestamp(p.time, WIB)
                    curr_dt = datetime.now(WIB)
                    dur_sec = max(0, int((curr_dt - open_dt).total_seconds()))
                    dur_min = dur_sec // 60
                    dur_hr = dur_min // 60
                    dur_str = f"{dur_hr}j {dur_min % 60}m" if dur_hr > 0 else f"{dur_min}m"

                    pos_list.append({
                        "ticket": p.ticket,
                        "symbol": p.symbol,
                        "type": pos_type,
                        "volume": round(p.volume, 2),
                        "price_open": round(p.price_open, 3 if "XAU" in p.symbol or "OIL" in p.symbol else 2),
                        "price_current": round(p.price_current, 3 if "XAU" in p.symbol or "OIL" in p.symbol else 2),
                        "sl": round(p.sl, 3 if "XAU" in p.symbol or "OIL" in p.symbol else 2),
                        "tp": round(p.tp, 3 if "XAU" in p.symbol or "OIL" in p.symbol else 2),
                        "pnl_idc": round(pnl_idc, 2),
                        "pnl_rp": round(pnl_idc / 100.0, 0),
                        "magic": magic,
                        "strategy": strat_name,
                        "open_time": open_dt.strftime("%d %b %H:%M:%S"),
                        "duration": dur_str,
                        "comment": getattr(p, "comment", "")
                    })

            pos_list.sort(key=lambda x: x["ticket"], reverse=True)

            login_str = str(acc.login)
            masked_login = login_str[:3] + "****" + login_str[-2:] if len(login_str) > 5 else login_str

            account_data = {
                "login": masked_login,
                "server": acc.server,
                "currency": acc.currency,
                "leverage": f"1:{acc.leverage:,}",
                "balance_idc": round(acc.balance, 2),
                "balance_rp": round(acc.balance / 100.0, 0),
                "equity_idc": round(acc.equity, 2),
                "equity_rp": round(acc.equity / 100.0, 0),
                "margin_idc": round(acc.margin, 2),
                "margin_free_idc": round(acc.margin_free, 2),
                "margin_free_rp": round(acc.margin_free / 100.0, 0),
                "margin_level_pct": round((acc.equity / acc.margin * 100.0), 1) if acc.margin > 0 else 0.0,
                "floating_idc": round(total_floating_idc, 2),
                "floating_rp": round(total_floating_idc / 100.0, 0),
            }

            # Hitung statistik setiap 15 detik
            if now - self.last_stats_calc > 15 or not self.cached_stats:
                self.calc_stats_and_history()
                self.last_stats_calc = now

            payload = {
                "connected": True,
                "timestamp": int(now),
                "server_time": datetime.now(WIB).strftime("%Y-%m-%d %H:%M:%S WIB"),
                "account": account_data,
                "positions_count": len(pos_list),
                "positions": pos_list,
                "stats": self.cached_stats,
                "history": self.cached_history[:300]
            }

            return payload
        except Exception as e:
            print(f"[{datetime.now(WIB).strftime('%H:%M:%S')}] Exception reading MT5: {e}")
            self.connected = False
            return None

    def calc_stats_and_history(self):
        curr_dt = datetime.now()
        start_of_month = datetime(curr_dt.year, curr_dt.month, 1)
        deals = mt5.history_deals_get(start_of_month, curr_dt)

        deposits_sum = 0.0
        withdrawals_sum = 0.0
        deposit_list = []
        withdrawal_list = []

        gross_profit = 0.0
        gross_loss = 0.0
        win_count = 0
        loss_count = 0
        ea_stats = {}
        history = []

        if deals:
            for d in reversed(deals):
                d_time = datetime.fromtimestamp(d.time, WIB).strftime("%d %b %Y %H:%M")
                # DEAL_TYPE_BALANCE = 2
                if d.type == 2:
                    if d.profit > 0:
                        deposits_sum += d.profit
                        deposit_list.append({
                            "ticket": d.ticket,
                            "time": d_time,
                            "amount_idc": round(d.profit, 2),
                            "amount_rp": round(d.profit / 100.0, 0),
                            "comment": d.comment or "Deposit Exness",
                        })
                    elif d.profit < 0:
                        withdrawals_sum += abs(d.profit)
                        withdrawal_list.append({
                            "ticket": d.ticket,
                            "time": d_time,
                            "amount_idc": round(abs(d.profit), 2),
                            "amount_rp": round(abs(d.profit) / 100.0, 0),
                            "comment": d.comment or "Withdrawal Bank",
                        })
                # DEAL_ENTRY_OUT (1) or DEAL_ENTRY_INOUT (2)
                elif d.entry in [1, 2]:
                    net = d.profit + getattr(d, "swap", 0.0) + getattr(d, "commission", 0.0)
                    mg = getattr(d, "magic", 0)
                    strat_name = MAGIC_NAMES.get(mg, f"Lainnya #{mg}" if mg != 0 else "👤 Manual Trade")

                    if strat_name not in ea_stats:
                        ea_stats[strat_name] = {
                            "name": strat_name,
                            "magic": mg,
                            "trades": 0,
                            "wins": 0,
                            "losses": 0,
                            "profit_idc": 0.0,
                            "loss_idc": 0.0,
                            "net_idc": 0.0,
                            "lots_sum": 0.0,
                        }

                    st = ea_stats[strat_name]
                    st["trades"] += 1
                    st["lots_sum"] += d.volume
                    st["net_idc"] += net

                    if net > 0:
                        gross_profit += net
                        win_count += 1
                        st["wins"] += 1
                        st["profit_idc"] += net
                    elif net < 0:
                        gross_loss += abs(net)
                        loss_count += 1
                        st["losses"] += 1
                        st["loss_idc"] += abs(net)

                    if len(history) < 300:
                        history.append({
                            "ticket": d.ticket,
                            "symbol": d.symbol,
                            "type": "BUY" if d.type == 0 else "SELL",
                            "volume": round(d.volume, 2),
                            "price": round(d.price, 3 if "XAU" in d.symbol or "OIL" in d.symbol else 2),
                            "net_idc": round(net, 2),
                            "net_rp": round(net / 100.0, 0),
                            "magic": mg,
                            "strategy": strat_name,
                            "time": d_time,
                            "comment": d.comment or ""
                        })

        total_trades = win_count + loss_count
        winrate = (win_count / total_trades * 100.0) if total_trades > 0 else 0.0
        profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else (99.9 if gross_profit > 0 else 0.0)
        net_pnl = gross_profit - gross_loss

        leaderboard = []
        for k, st in ea_stats.items():
            tot = st["trades"]
            wr = (st["wins"] / tot * 100.0) if tot > 0 else 0.0
            pf = (st["profit_idc"] / st["loss_idc"]) if st["loss_idc"] > 0 else (99.9 if st["profit_idc"] > 0 else 0.0)
            leaderboard.append({
                "name": st["name"],
                "magic": st["magic"],
                "trades": tot,
                "wins": st["wins"],
                "losses": st["losses"],
                "winrate_pct": round(wr, 1),
                "profit_factor": round(pf, 2),
                "net_idc": round(st["net_idc"], 2),
                "net_rp": round(st["net_idc"] / 100.0, 0),
                "avg_lot": round(st["lots_sum"] / tot, 2) if tot > 0 else 0.05,
            })
        leaderboard.sort(key=lambda x: x["net_idc"], reverse=True)

        month_names_id = [
            "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ]
        month_label = f"{month_names_id[curr_dt.month]} {curr_dt.year}"

        self.cached_stats = {
            "month_label": month_label,
            "gross_profit_idc": round(gross_profit, 2),
            "gross_profit_rp": round(gross_profit / 100.0, 0),
            "total_loss_idc": round(gross_loss, 2),
            "total_loss_rp": round(gross_loss / 100.0, 0),
            "net_pnl_idc": round(net_pnl, 2),
            "net_pnl_rp": round(net_pnl / 100.0, 0),
            "total_wd_idc": round(withdrawals_sum, 2),
            "total_wd_rp": round(withdrawals_sum / 100.0, 0),
            "wd_count": len(withdrawal_list),
            "wd_list": withdrawal_list,
            "total_deposit_idc": round(deposits_sum, 2),
            "total_deposit_rp": round(deposits_sum / 100.0, 0),
            "deposit_count": len(deposit_list),
            "deposit_list": deposit_list,
            "total_trades": total_trades,
            "win_count": win_count,
            "loss_count": loss_count,
            "winrate_pct": round(winrate, 1),
            "profit_factor": round(profit_factor, 2),
            "leaderboard": leaderboard,
        }
        self.cached_history = history

    def send_sync(self, payload):
        req_data = json.dumps({
            "secret": SYNC_SECRET,
            "data": payload
        }).encode("utf-8")

        req = urllib.request.Request(
            SYNC_URL,
            data=req_data,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "ReezTrade-MT5Sync/2.0"
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=8) as res:
                if res.status == 200:
                    return True
        except urllib.error.HTTPError as he:
            print(f"[{datetime.now(WIB).strftime('%H:%M:%S')}] HTTP Error sync ({he.code}): {he.read().decode('utf-8', 'ignore')}")
        except Exception as e:
            # Network issue or connection drop
            pass
        return False

def main():
    print("=========================================================")
    print("⚡ REEZTRADE LIVE SYNC AGENT -> trade.reez.my.id")
    print(f"🎯 Target Endpoint : {SYNC_URL}")
    print(f"⏱️ Interval Sync   : {INTERVAL_SEC} detik")
    print("=========================================================")

    sync = MT5LiveSync()
    sync_count = 0

    while True:
        try:
            payload = sync.collect_live_snapshot()
            if payload:
                ok = sync.send_sync(payload)
                sync_count += 1
                pos_c = payload["positions_count"]
                bal_rp = payload["account"]["balance_rp"]
                float_rp = payload["account"]["floating_rp"]
                now_str = datetime.now(WIB).strftime("%H:%M:%S")

                status_mark = "🟢 OK" if ok else "🔴 FAIL"
                if sync_count % 10 == 1 or not ok:
                    print(f"[{now_str}] Sync #{sync_count} [{status_mark}] | Pos: {pos_c} | Bal: Rp {bal_rp:,.0f} | Float: Rp {float_rp:,.0f}")
            time.sleep(INTERVAL_SEC)
        except KeyboardInterrupt:
            print("\nSync Agent dihentikan.")
            break
        except Exception as ex:
            print(f"Sync loop error: {ex}")
            time.sleep(3)

if __name__ == "__main__":
    main()

