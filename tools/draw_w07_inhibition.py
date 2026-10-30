#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
draw_w07_inhibition.py — 重繪 W07「競爭性 vs 非競爭性抑制」速率曲線。

2026-10-29：原 AI 生成圖右圖（非競爭性）把 [S] = Km 那條水平虛線標成「Vmax」，
應為 ½Vmax；曲線也不是 Michaelis–Menten（control 在 Km 時約 0.79 Vmax）。
學生在同一週學「[S] = Km 時 v₀ = Vmax/2」，圖卻畫成另一個值。
本腳本改用 v₀ = Vmax[S] / (Km + [S]) 直接計算，每條參考虛線都從同一組參數算出來，
不會再出現標籤和曲線對不上的情況。抑制劑曲線同時用紅色與虛線，黑白也分得出來。

標號語意沿用（題庫 W07-E01/E02、w09 標圖牆解答、期中複習2 Kahoot 依賴）：
  ① 左圖：競爭性抑制曲線（Km 變大，Vmax 不變）
  ② 右圖：非競爭性抑制曲線（Vmax 變小，Km 不變）
  ③ 左圖右上：兩曲線終將達到同一個 Vmax

輸出：
  assets/redrawn/w07_inhibition_clean.png / _labeled.png   (1672x941)
  site/assets/figures/w07_inhibition.jpg                    (1400x788，投影片與互動課程用)
  site/assets/figures/labeled/w07_inhibition.jpg            (1400x788，w09 標圖牆用)
"""
import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle
from PIL import Image

BG = "#FDF9ED"            # 與原 site 圖底色相同 (253, 249, 237)
BLUE, RED = "#1F4EC2", "#D7191C"
GUIDE = "#333333"
plt.rcParams["mathtext.fontset"] = "stix"
plt.rcParams["font.family"] = "STIXGeneral"

VMAX, KM = 1.0, 2.0
KM_APP = 3.5 * KM          # 競爭性：Km 變大
VMAX_APP = 0.6 * VMAX      # 非競爭性：Vmax 變小
SMAX = 40.0


def mm(s, vmax, km):
    return vmax * s / (km + s)


def badge(ax, xy, num):
    # 半徑以資料座標表示；x、y 軸比例不同，用 transform 換算成正圓
    x, y = ax.transData.transform(xy)
    ax.add_patch(Circle((x, y), 21, transform=None, facecolor="#C21807",
                        edgecolor="white", lw=2.2, zorder=9))
    ax.text(xy[0], xy[1], str(num), ha="center", va="center", fontsize=17,
            fontweight="bold", color="white", zorder=10, family="DejaVu Sans")


def hline(ax, y, x1, color=GUIDE):
    ax.plot([0, x1], [y, y], color=color, lw=1.4, ls=(0, (5, 4)), zorder=1)


def vline(ax, x, y1, color=GUIDE):
    ax.plot([x, x], [0, y1], color=color, lw=1.4, ls=(0, (5, 4)), zorder=1)


def ylab(ax, y, text, color="black"):
    ax.text(-0.9, y, text, ha="right", va="center", fontsize=25, color=color)


def setup(ax):
    ax.set_facecolor(BG)
    ax.set_xlim(0, SMAX + 2)
    ax.set_ylim(0, 1.13)
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    for side in ("left", "bottom"):
        ax.spines[side].set_linewidth(2.2)
    ax.set_xticks([]); ax.set_yticks([])
    # 箭頭軸
    ax.plot(1, 0, ">k", transform=ax.get_yaxis_transform(), clip_on=False, ms=9)
    ax.plot(0, 1, "^k", transform=ax.get_xaxis_transform(), clip_on=False, ms=9)
    # 軸名放在箭頭旁，不和左側的 Vmax 標籤搶位置
    ax.text(SMAX + 1.5, -0.04, "$[S]$", ha="center", va="top", fontsize=27)
    ax.text(1.0, 1.12, "$v_0$", ha="left", va="top", fontsize=27)


def draw(labeled, out_png):
    S = np.linspace(0, SMAX, 800)
    fig, (axL, axR) = plt.subplots(1, 2, figsize=(16.72, 9.41), dpi=100)
    fig.patch.set_facecolor(BG)

    for ax in (axL, axR):
        setup(ax)
        ax.plot(S, mm(S, VMAX, KM), color=BLUE, lw=3.2, label="control", zorder=4)
        hline(ax, VMAX, SMAX)
        ylab(ax, VMAX, r"$V_{\max}$")

    # ---------- 左：競爭性 ----------
    axL.plot(S, mm(S, VMAX, KM_APP), color=RED, lw=3.2, ls=(0, (6, 2.5)),
             label="inhibitor", zorder=4)
    hline(axL, 0.5 * VMAX, KM_APP)
    vline(axL, KM, 0.5 * VMAX, BLUE)
    vline(axL, KM_APP, 0.5 * VMAX, RED)
    ylab(axL, 0.5 * VMAX, r"$\frac{1}{2}V_{\max}$")
    axL.text(KM, -0.03, r"$K_m$", ha="center", va="top", fontsize=23, color=BLUE)
    axL.text(KM_APP, -0.03, r"$K_m^{\mathrm{app}}$", ha="center", va="top", fontsize=23, color=RED)

    # ---------- 右：非競爭性 ----------
    axR.plot(S, mm(S, VMAX_APP, KM), color=RED, lw=3.2, ls=(0, (6, 2.5)),
             label="inhibitor", zorder=4)
    hline(axR, VMAX_APP, SMAX)
    hline(axR, 0.5 * VMAX, KM)
    hline(axR, 0.5 * VMAX_APP, KM)
    vline(axR, KM, 0.5 * VMAX, BLUE)
    ylab(axR, VMAX_APP, r"$V_{\max}^{\mathrm{app}}$", RED)
    ylab(axR, 0.5 * VMAX, r"$\frac{1}{2}V_{\max}$")
    ylab(axR, 0.5 * VMAX_APP, r"$\frac{1}{2}V_{\max}^{\mathrm{app}}$", RED)
    axR.text(KM, -0.03, r"$K_m$", ha="center", va="top", fontsize=23, color=BLUE)

    for ax in (axL, axR):
        ax.legend(loc="lower right", fontsize=22, frameon=False, handlelength=2.6,
                  prop={"family": "DejaVu Sans", "size": 21})

    # 結構性檢查：每條參考線都真的落在曲線上
    assert abs(mm(KM, VMAX, KM) - 0.5 * VMAX) < 1e-12
    assert abs(mm(KM_APP, VMAX, KM_APP) - 0.5 * VMAX) < 1e-12
    assert abs(mm(KM, VMAX_APP, KM) - 0.5 * VMAX_APP) < 1e-12

    plt.subplots_adjust(left=0.085, right=0.985, top=0.95, bottom=0.12, wspace=0.24)
    if labeled:
        fig.canvas.draw()   # 先定版面，badge 的像素半徑才準
        badge(axL, (17, mm(17, VMAX, KM_APP) - 0.11), 1)
        badge(axR, (20, VMAX_APP - 0.11), 2)
        badge(axL, (SMAX - 2, VMAX + 0.065), 3)
    fig.savefig(out_png, facecolor=BG)
    plt.close(fig)
    print("wrote", out_png)
    return out_png


def to_site_jpg(png, jpg):
    Image.open(png).convert("RGB").resize((1400, 788), Image.LANCZOS).save(jpg, quality=92)
    print("wrote", jpg)


if __name__ == "__main__":
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
    red = os.path.join(root, "assets", "redrawn")
    fig_dir = os.path.join(root, "site", "assets", "figures")
    clean = draw(False, os.path.join(red, "w07_inhibition_clean.png"))
    lab = draw(True, os.path.join(red, "w07_inhibition_labeled.png"))
    to_site_jpg(clean, os.path.join(fig_dir, "w07_inhibition.jpg"))
    to_site_jpg(lab, os.path.join(fig_dir, "labeled", "w07_inhibition.jpg"))
