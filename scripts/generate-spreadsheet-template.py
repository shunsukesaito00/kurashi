#!/usr/bin/env python3
"""BOOTH向け手取り試算 .xlsx テンプレートを生成する。要: pip install openpyxl"""
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "products" / "tedori-kakei-template.xlsx"

SALARY_DED = (
    "=IF({c}5<=1625000,550000,"
    "IF({c}5<=1800000,{c}5*0.4-100000,"
    "IF({c}5<=3600000,{c}5*0.3+80000,"
    "IF({c}5<=6600000,{c}5*0.2+440000,"
    "IF({c}5<=8500000,{c}5*0.1+1100000,"
    "1950000)))))"
)

INCOME_TAX = (
    "=IF({c}11<=0,0,"
    "IF({c}11<=1950000,{c}11*0.05,"
    "IF({c}11<=3300000,{c}11*0.1-97500,"
    "IF({c}11<=6950000,{c}11*0.2-427500,"
    "IF({c}11<=9000000,{c}11*0.23-636000,"
    "IF({c}11<=18000000,{c}11*0.33-1536000,"
    "IF({c}11<=40000000,{c}11*0.4-2796000,"
    "{c}11*0.45-4796000)))))))*1.021"
)


def apply_net_formulas(ws, col: str, input_row_salary: int = 3, input_row_bonus: int = 4):
    c = col
    r = input_row_salary
    b = input_row_bonus
    ws[f"{c}5"] = f"={c}{r}*12+{c}{b}"
    ws[f"{c}6"] = f"=ROUND({c}{r}*0.0495,0)"
    ws[f"{c}7"] = f"=ROUND({c}{r}*0.0915,0)"
    ws[f"{c}8"] = f"=ROUND({c}{r}*0.0055,0)"
    ws[f"{c}9"] = f"=({c}6+{c}7+{c}8)*12+{c}{b}*0.1465"
    ws[f"{c}10"] = SALARY_DED.format(c=c)
    ws[f"{c}11"] = f"=MAX(0,{c}5-{c}10-{c}9-480000)"
    ws[f"{c}12"] = INCOME_TAX.format(c=c)
    ws[f"{c}13"] = f"=MAX(0,{c}5-{c}10-{c}9-430000)"
    ws[f"{c}14"] = f"={c}13*0.1+5000"
    ws[f"{c}15"] = f'=IF({c}5=0,0,ROUND({c}12/12*({c}{r}*12/{c}5),0))'
    ws[f"{c}16"] = f"=ROUND({c}14/12,0)"
    ws[f"{c}17"] = f"={c}{r}-{c}6-{c}7-{c}8-{c}15-{c}16"


def style_header(ws, title: str):
    ws["A1"] = title
    ws["A1"].font = Font(bold=True, size=14)
    ws["A2"] = "※概算です。健保・扶養・住民税の開始時期等は反映しません。給与明細・勤務先でご確認ください。"
    ws["A2"].font = Font(size=9, color="666666")
    ws.column_dimensions["A"].width = 28
    for col in "BCD":
        ws.column_dimensions[col].width = 16


def style_yen(ws, cells):
    for ref in cells:
        ws[ref].number_format = "#,##0"


def build_single_sheet(wb):
    ws = wb.active
    ws.title = "手取り試算"
    style_header(ws, "手取り試算 — くらしの計算室（2026年版）")

    labels = {
        3: "月収（額面・円）",
        4: "年間ボーナス（円）",
        5: "年間額面",
        6: "健康保険料（月）",
        7: "厚生年金（月）",
        8: "雇用保険（月）",
        9: "社会保険料（年）",
        10: "給与所得控除（年）",
        11: "課税所得・所得税用（年）",
        12: "所得税（年・復興含む）",
        13: "課税標準・住民税用（年）",
        14: "住民税（年）",
        15: "所得税（月割）",
        16: "住民税（月割）",
        17: "毎月の手取り",
        18: "控除合計（月）",
        19: "手取り率",
        20: "年間手取り目安（簡易）",
    }
    for row, label in labels.items():
        ws[f"A{row}"] = label
        if row >= 5:
            ws[f"A{row}"].font = Font(color="444444")

    ws["B3"] = 300000
    ws["B4"] = 0
    apply_net_formulas(ws, "B")
    ws["B18"] = "=B3-B17"
    ws["B19"] = "=IF(B3=0,\"\",B17/B3)"
    ws["B19"].number_format = "0.0%"
    ws["B20"] = "=B17*12"

    style_yen(
        ws,
        [f"B{r}" for r in range(3, 21) if r != 19],
    )
    ws["B17"].font = Font(bold=True, size=12)
    ws["B17"].fill = PatternFill("solid", fgColor="E8F4EA")


def build_compare_sheet(wb):
    ws = wb.create_sheet("手取り比較")
    style_header(ws, "手取り比較（最大3パターン）— くらしの計算室")

    ws["B2"] = "パターンA"
    ws["C2"] = "パターンB"
    ws["D2"] = "パターンC"
    for c in "BCD":
        ws[f"{c}2"].font = Font(bold=True)
        ws[f"{c}2"].alignment = Alignment(horizontal="center")

    ws["A3"] = "月収（額面・円）"
    ws["A4"] = "年間ボーナス（円）"
    mid_labels = {
        5: "年間額面",
        6: "健康保険料（月）",
        7: "厚生年金（月）",
        8: "雇用保険（月）",
        9: "社会保険料（年）",
        10: "給与所得控除（年）",
        11: "課税所得・所得税用（年）",
        12: "所得税（年・復興含む）",
        13: "課税標準・住民税用（年）",
        14: "住民税（年）",
        15: "所得税（月割）",
        16: "住民税（月割）",
    }
    for row, label in mid_labels.items():
        ws[f"A{row}"] = label
        ws[f"A{row}"].font = Font(color="444444")
    ws["B3"], ws["C3"], ws["D3"] = 300000, 330000, 360000
    ws["B4"], ws["C4"], ws["D4"] = 0, 0, 0

    for col in "BCD":
        apply_net_formulas(ws, col)

    summary = {
        17: "毎月の手取り",
        18: "手取り率",
        19: "Aとの手取り差（月）",
        20: "Aとの手取り差（年）",
    }
    for row, label in summary.items():
        ws[f"A{row}"] = label

    for col in "BCD":
        ws[f"{col}18"] = f"=IF({col}3=0,\"\",{col}17/{col}3)"
        ws[f"{col}18"].number_format = "0.0%"
    ws["B19"] = "—"
    ws["B20"] = "—"
    ws["C19"] = "=$C$17-$B$17"
    ws["D19"] = "=$D$17-$B$17"
    ws["C20"] = "=C19*12"
    ws["D20"] = "=D19*12"

    for col in "BCD":
        ws[f"{col}17"].font = Font(bold=True)
        style_yen(ws, [f"{col}{r}" for r in range(3, 21) if r not in (18, 19) or r == 17])
    ws["C19"].number_format = "#,##0"
    ws["D19"].number_format = "#,##0"
    ws["C20"].number_format = "#,##0"
    ws["D20"].number_format = "#,##0"


def verify_with_tedori_logic():
    """tools/tedori.html の computeNet と代表例が一致するか（Python再実装）。"""

    def salary_deduction(gross):
        if gross <= 1_625_000:
            return 550_000
        if gross <= 1_800_000:
            return gross * 0.4 - 100_000
        if gross <= 3_600_000:
            return gross * 0.3 + 80_000
        if gross <= 6_600_000:
            return gross * 0.2 + 440_000
        if gross <= 8_500_000:
            return gross * 0.1 + 1_100_000
        return 1_950_000

    def income_tax_annual(taxable):
        brackets = [
            (1_950_000, 0.05, 0),
            (3_300_000, 0.10, 97_500),
            (6_950_000, 0.20, 427_500),
            (9_000_000, 0.23, 636_000),
            (18_000_000, 0.33, 1_536_000),
            (40_000_000, 0.40, 2_796_000),
            (float("inf"), 0.45, 4_796_000),
        ]
        if taxable <= 0:
            return 0
        for limit, rate, ded in brackets:
            if taxable <= limit:
                return taxable * rate - ded
        return 0

    def compute_net(salary, bonus=0):
        annual = salary * 12 + bonus
        health = salary * 0.0495
        pension = salary * 0.0915
        emp = salary * 0.0055
        social = (health + pension + emp) * 12 + bonus * 0.1465
        taxable = max(0, annual - salary_deduction(annual) - social - 480_000)
        income = income_tax_annual(taxable) * 1.021
        res_taxable = max(0, annual - salary_deduction(annual) - social - 430_000)
        resident = res_taxable * 0.10 + 5_000
        monthly_income = income / 12 * (salary * 12 / annual) if annual else 0
        return round(salary - health - pension - emp - monthly_income - resident / 12)

    cases = [(300_000, 237_184), (330_000, 259_827), (360_000, 282_471)]
    for salary, expected in cases:
        got = compute_net(salary)
        if got != expected:
            raise SystemExit(f"検証失敗: 月収{salary} → {got} (期待 {expected})")


def main():
    verify_with_tedori_logic()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    wb = Workbook()
    build_single_sheet(wb)
    build_compare_sheet(wb)
    wb.save(OUT)
    print(f"OK: {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
