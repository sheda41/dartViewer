import { useState, useMemo } from "react";

// ─── 팔레트 & 디자인 토큰 ────────────────────────────────────────
// 기업 내부 감사 툴: 딥네이비 기반, 엠버 액센트, 모노스페이스 숫자 강조
// 서체: system-ui 계열, 데이터는 tabular-nums

const COLORS = {
  navy: "#0F1C2E",
  navyMid: "#1A2F4A",
  navyLight: "#243B55",
  amber: "#E8A020",
  amberLight: "#FFC85A",
  steel: "#4A6785",
  steelLight: "#7A9BBF",
  bg: "#F0F4F8",
  bgCard: "#FFFFFF",
  text: "#1A2332",
  textMuted: "#5A6E84",
  border: "#D4DCE6",
  green: "#1A7A4A",
  greenBg: "#E6F4ED",
  red: "#C0392B",
  redBg: "#FDECEA",
  yellow: "#B8860B",
  yellowBg: "#FEF9E7",
  purple: "#6B3FA0",
  purpleBg: "#F3EEF9",
};

// ─── 초기 데이터 ─────────────────────────────────────────────────

const INITIAL_NOTICES = [
  {
    id: 1, title: "2025년 하반기 재고실사 시행 공지",
    date: "2025-11-01", author: "재경팀장", important: true,
    content: `2025년 하반기 정기 재고실사를 아래와 같이 시행합니다.\n\n■ 실사 일정: 2025.11.15(토) ~ 11.16(일)\n■ 실사 대상: 반도체 부문 전 사업장 재고\n■ 수검반: 각 사업부 재경팀\n■ 조사반: 재경팀 감사지원TF\n\n실사 전 재고수불부 마감 및 시스템 입력 완료 바랍니다.`,
  },
  {
    id: 2, title: "재고실사 절차 매뉴얼 배포",
    date: "2025-11-03", author: "감사지원TF", important: false,
    content: `재고실사 절차 매뉴얼(Rev.3)을 배포합니다.\n\n주요 개정 사항:\n- 샘플링 기준 업데이트 (금액 기준 상위 20% → 전수조사)\n- 결재 프로세스 전산화\n- 차이분석 양식 변경`,
  },
  {
    id: 3, title: "[긴급] 화성캠퍼스 실사 일정 변경",
    date: "2025-11-10", author: "재경팀", important: true,
    content: `화성캠퍼스 라인 가동 일정 변경으로 인해 실사 일정이 조정됩니다.\n\n변경 전: 11.15(토) 09:00\n변경 후: 11.15(토) 14:00\n\n수검반 및 조사반 인원은 집결 시간에 유의하시기 바랍니다.`,
  },
];

const DEPARTMENTS = ["DS부문 재경팀", "MX사업부 재경팀", "VD사업부 재경팀", "하만 재경팀", "감사지원TF"];

const INITIAL_MEMBERS = [
  { id: 1, name: "김재원", dept: "DS부문 재경팀", role: "수검반", site: "화성캠퍼스", phone: "010-1234-5678" },
  { id: 2, name: "이수진", dept: "DS부문 재경팀", role: "수검반", site: "화성캠퍼스", phone: "010-2345-6789" },
  { id: 3, name: "박민준", dept: "감사지원TF", role: "조사반", site: "화성캠퍼스", phone: "010-3456-7890" },
  { id: 4, name: "최지현", dept: "감사지원TF", role: "조사반", site: "화성캠퍼스", phone: "010-4567-8901" },
  { id: 5, name: "정다은", dept: "MX사업부 재경팀", role: "수검반", site: "수원캠퍼스", phone: "010-5678-9012" },
  { id: 6, name: "한승호", dept: "감사지원TF", role: "조사반", site: "수원캠퍼스", phone: "010-6789-0123" },
  { id: 7, name: "윤서연", dept: "VD사업부 재경팀", role: "수검반", site: "수원캠퍼스", phone: "010-7890-1234" },
];

const INITIAL_POPULATION = [
  { id: "INV-001", name: "HBM3E 메모리 모듈", category: "반도체", location: "화성 F17", qty: 12500, unitCost: 320000, totalCost: 4000000000, sampled: false },
  { id: "INV-002", name: "LPDDR5 칩셋", category: "반도체", location: "화성 F18", qty: 45000, unitCost: 85000, totalCost: 3825000000, sampled: false },
  { id: "INV-003", name: "낸드플래시 256GB", category: "반도체", location: "평택 P3", qty: 78000, unitCost: 42000, totalCost: 3276000000, sampled: false },
  { id: "INV-004", name: "시스템 온칩 엑시노스", category: "반도체", location: "화성 F16", qty: 5200, unitCost: 580000, totalCost: 3016000000, sampled: false },
  { id: "INV-005", name: "OLED 패널 6.1인치", category: "디스플레이", location: "수원 DX1", qty: 32000, unitCost: 85000, totalCost: 2720000000, sampled: false },
  { id: "INV-006", name: "DDR5 서버용 메모리", category: "반도체", location: "평택 P4", qty: 28000, unitCost: 95000, totalCost: 2660000000, sampled: false },
  { id: "INV-007", name: "파워반도체 GaN", category: "반도체", location: "기흥 G2", qty: 15000, unitCost: 125000, totalCost: 1875000000, sampled: false },
  { id: "INV-008", name: "이미지센서 200MP", category: "반도체", location: "기흥 G3", qty: 22000, unitCost: 78000, totalCost: 1716000000, sampled: false },
  { id: "INV-009", name: "QLED TV 65인치 패널", category: "디스플레이", location: "수원 DX2", qty: 4800, unitCost: 320000, totalCost: 1536000000, sampled: false },
  { id: "INV-010", name: "스마트폰 카메라모듈", category: "모듈", location: "수원 MX1", qty: 95000, unitCost: 15000, totalCost: 1425000000, sampled: false },
  { id: "INV-011", name: "배터리 팩 5000mAh", category: "모듈", location: "수원 MX2", qty: 110000, unitCost: 12000, totalCost: 1320000000, sampled: false },
  { id: "INV-012", name: "SSD 1TB M.2", category: "반도체", location: "평택 P2", qty: 38000, unitCost: 32000, totalCost: 1216000000, sampled: false },
  { id: "INV-013", name: "무선충전 모듈", category: "모듈", location: "수원 MX3", qty: 75000, unitCost: 8500, totalCost: 637500000, sampled: false },
  { id: "INV-014", name: "오디오 IC 칩", category: "반도체", location: "기흥 G1", qty: 180000, unitCost: 3200, totalCost: 576000000, sampled: false },
  { id: "INV-015", name: "냉장고 컴프레서", category: "가전부품", location: "수원 HA1", qty: 8500, unitCost: 45000, totalCost: 382500000, sampled: false },
];

const fmt = (n) => n?.toLocaleString("ko-KR");
const fmtKRW = (n) => {
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}억`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(0)}만`;
  return n?.toLocaleString();
};

// ─── 배지 컴포넌트 ────────────────────────────────────────────────
const Badge = ({ children, color = "steel" }) => {
  const map = {
    steel: { bg: "#EBF1F7", color: COLORS.steel },
    green: { bg: COLORS.greenBg, color: COLORS.green },
    red: { bg: COLORS.redBg, color: COLORS.red },
    amber: { bg: "#FEF3DC", color: COLORS.amber },
    purple: { bg: COLORS.purpleBg, color: COLORS.purple },
    navy: { bg: COLORS.navyLight, color: "#FFFFFF" },
  };
  const s = map[color] || map.steel;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 3,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
      background: s.bg, color: s.color, textTransform: "uppercase",
    }}>{children}</span>
  );
};

// ─── 탭 1: 공지사항 ───────────────────────────────────────────────
const TabNotice = () => {
  const [notices] = useState(INITIAL_NOTICES);
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ display: "flex", gap: 20, height: "100%" }}>
      {/* 목록 */}
      <div style={{ width: 340, flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: "0.08em", marginBottom: 10 }}>
          전체 {notices.length}건
        </div>
        {notices.map((n) => (
          <div key={n.id} onClick={() => setSelected(n)}
            style={{
              padding: "14px 16px", marginBottom: 8, borderRadius: 6,
              border: `1.5px solid ${selected?.id === n.id ? COLORS.amber : COLORS.border}`,
              background: selected?.id === n.id ? "#FFFBF0" : COLORS.bgCard,
              cursor: "pointer", transition: "all 0.15s",
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              {n.important && <Badge color="red">긴급</Badge>}
              <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{n.title}</span>
            </div>
            <div style={{ fontSize: 11, color: COLORS.textMuted }}>
              {n.author} · {n.date}
            </div>
          </div>
        ))}
      </div>

      {/* 본문 */}
      <div style={{ flex: 1, background: COLORS.bgCard, borderRadius: 8, border: `1px solid ${COLORS.border}`, padding: 28 }}>
        {selected ? (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
              {selected.important && <Badge color="red">긴급공지</Badge>}
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.navy }}>{selected.title}</h2>
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${COLORS.border}` }}>
              작성자: {selected.author} &nbsp;|&nbsp; 작성일: {selected.date}
            </div>
            <pre style={{ margin: 0, fontFamily: "inherit", fontSize: 14, lineHeight: 1.8, color: COLORS.text, whiteSpace: "pre-wrap" }}>
              {selected.content}
            </pre>
          </>
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textMuted, fontSize: 14 }}>
            공지를 선택하여 내용을 확인하세요
          </div>
        )}
      </div>
    </div>
  );
};

// ─── 탭 2: 인원 현황 ─────────────────────────────────────────────
const TabMembers = () => {
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", dept: DEPARTMENTS[0], role: "수검반", site: "화성캠퍼스", phone: "" });
  const [filterRole, setFilterRole] = useState("전체");

  const filtered = filterRole === "전체" ? members : members.filter((m) => m.role === filterRole);
  const byRole = { 수검반: members.filter(m => m.role === "수검반"), 조사반: members.filter(m => m.role === "조사반") };

  const addMember = () => {
    if (!form.name) return;
    setMembers([...members, { ...form, id: Date.now() }]);
    setShowModal(false);
    setForm({ name: "", dept: DEPARTMENTS[0], role: "수검반", site: "화성캠퍼스", phone: "" });
  };

  const removeMember = (id) => setMembers(members.filter(m => m.id !== id));

  return (
    <div>
      {/* 요약 카드 */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
        {[
          { label: "전체 인원", value: members.length, unit: "명", color: COLORS.navy },
          { label: "수검반", value: byRole.수검반.length, unit: "명", color: COLORS.steel },
          { label: "조사반", value: byRole.조사반.length, unit: "명", color: COLORS.amber },
          { label: "사업장 수", value: [...new Set(members.map(m => m.site))].length, unit: "개소", color: COLORS.green },
        ].map((s) => (
          <div key={s.label} style={{
            flex: 1, background: COLORS.bgCard, borderRadius: 8, padding: "16px 20px",
            border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${s.color}`,
          }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 700, letterSpacing: "0.05em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontVariantNumeric: "tabular-nums" }}>
              {s.value}<span style={{ fontSize: 13, fontWeight: 400, marginLeft: 4, color: COLORS.textMuted }}>{s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 툴바 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        {["전체", "수검반", "조사반"].map((r) => (
          <button key={r} onClick={() => setFilterRole(r)} style={{
            padding: "6px 16px", borderRadius: 4, fontSize: 13, fontWeight: 600,
            border: `1.5px solid ${filterRole === r ? COLORS.amber : COLORS.border}`,
            background: filterRole === r ? "#FEF3DC" : COLORS.bgCard,
            color: filterRole === r ? COLORS.amber : COLORS.textMuted, cursor: "pointer",
          }}>{r}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowModal(true)} style={{
          padding: "8px 18px", borderRadius: 5, fontSize: 13, fontWeight: 700,
          background: COLORS.navy, color: "#FFF", border: "none", cursor: "pointer",
        }}>+ 인원 추가</button>
      </div>

      {/* 테이블 */}
      <div style={{ background: COLORS.bgCard, borderRadius: 8, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: COLORS.navy }}>
              {["성명", "소속", "역할", "담당 사업장", "연락처", "관리"].map((h) => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", color: "#B8C8DC", fontWeight: 700, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr key={m.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.bgCard : "#F8FAFB" }}>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: COLORS.text }}>{m.name}</td>
                <td style={{ padding: "12px 16px", color: COLORS.textMuted }}>{m.dept}</td>
                <td style={{ padding: "12px 16px" }}><Badge color={m.role === "조사반" ? "amber" : "steel"}>{m.role}</Badge></td>
                <td style={{ padding: "12px 16px", color: COLORS.text }}>{m.site}</td>
                <td style={{ padding: "12px 16px", color: COLORS.textMuted, fontVariantNumeric: "tabular-nums" }}>{m.phone}</td>
                <td style={{ padding: "12px 16px" }}>
                  <button onClick={() => removeMember(m.id)} style={{
                    padding: "3px 10px", borderRadius: 3, fontSize: 11, fontWeight: 600,
                    border: `1px solid ${COLORS.border}`, background: "transparent",
                    color: COLORS.textMuted, cursor: "pointer",
                  }}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모달 */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: COLORS.bgCard, borderRadius: 10, padding: 28, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: COLORS.navy }}>인원 추가</h3>
            {[
              { label: "성명", key: "name", type: "text" },
              { label: "연락처", key: "phone", type: "text" },
            ].map(({ label, key, type }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: COLORS.textMuted, marginBottom: 5 }}>{label}</label>
                <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} type={type}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 5, border: `1.5px solid ${COLORS.border}`, fontSize: 13, boxSizing: "border-box" }} />
              </div>
            ))}
            {[
              { label: "소속", key: "dept", options: DEPARTMENTS },
              { label: "역할", key: "role", options: ["수검반", "조사반"] },
              { label: "사업장", key: "site", options: ["화성캠퍼스", "평택캠퍼스", "수원캠퍼스", "기흥캠퍼스"] },
            ].map(({ label, key, options }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: COLORS.textMuted, marginBottom: 5 }}>{label}</label>
                <select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 5, border: `1.5px solid ${COLORS.border}`, fontSize: 13 }}>
                  {options.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "8px 18px", borderRadius: 5, border: `1px solid ${COLORS.border}`, background: "transparent", fontSize: 13, cursor: "pointer" }}>취소</button>
              <button onClick={addMember} style={{ padding: "8px 20px", borderRadius: 5, background: COLORS.navy, color: "#FFF", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>추가</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── 탭 3: 모집단 & 샘플링 ────────────────────────────────────────
const TabSampling = ({ population, setPopulation }) => {
  const [method, setMethod] = useState("monetary"); // monetary | random | stratified
  const [sampleRate, setSampleRate] = useState(20);
  const [threshold, setThreshold] = useState(2000000000);

  const totalPop = population.length;
  const sampledCount = population.filter(p => p.sampled).length;
  const totalValue = population.reduce((s, p) => s + p.totalCost, 0);
  const sampledValue = population.filter(p => p.sampled).reduce((s, p) => s + p.totalCost, 0);

  const runSampling = () => {
    let updated = population.map(p => ({ ...p, sampled: false }));
    if (method === "monetary") {
      updated = updated.map(p => ({ ...p, sampled: p.totalCost >= threshold }));
    } else if (method === "random") {
      const n = Math.ceil(population.length * sampleRate / 100);
      const indices = new Set();
      while (indices.size < n) indices.add(Math.floor(Math.random() * population.length));
      updated = updated.map((p, i) => ({ ...p, sampled: indices.has(i) }));
    } else {
      // stratified: 카테고리별 비례
      const cats = [...new Set(population.map(p => p.category))];
      const selected = new Set();
      cats.forEach(cat => {
        const items = population.filter(p => p.category === cat);
        const n = Math.max(1, Math.ceil(items.length * sampleRate / 100));
        items.slice(0, n).forEach(p => selected.add(p.id));
      });
      updated = updated.map(p => ({ ...p, sampled: selected.has(p.id) }));
    }
    setPopulation(updated);
  };

  const clearSampling = () => setPopulation(population.map(p => ({ ...p, sampled: false })));

  return (
    <div>
      {/* 통계 카드 */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
        {[
          { label: "전체 모집단", value: fmt(totalPop), unit: "건", color: COLORS.navy },
          { label: "샘플 선정", value: fmt(sampledCount), unit: "건", color: COLORS.amber },
          { label: "전체 장부가", value: fmtKRW(totalValue), unit: "원", color: COLORS.steel },
          { label: "샘플 장부가", value: fmtKRW(sampledValue), unit: "원", color: COLORS.green },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, background: COLORS.bgCard, borderRadius: 8, padding: "16px 20px", border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 700, letterSpacing: "0.05em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontVariantNumeric: "tabular-nums" }}>
              {s.value}<span style={{ fontSize: 12, fontWeight: 400, marginLeft: 4, color: COLORS.textMuted }}>{s.unit}</span>
            </div>
            {s.label === "샘플 선정" && totalPop > 0 && (
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 3 }}>
                커버리지 {(sampledCount / totalPop * 100).toFixed(0)}%
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 샘플링 설정 패널 */}
      <div style={{ background: COLORS.bgCard, borderRadius: 8, border: `1px solid ${COLORS.border}`, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.navy, marginBottom: 14, letterSpacing: "0.05em" }}>샘플링 방법 설정</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {[
            { val: "monetary", label: "금액 기준 (MUS)" },
            { val: "random", label: "무작위 추출" },
            { val: "stratified", label: "층화 추출" },
          ].map(m => (
            <button key={m.val} onClick={() => setMethod(m.val)} style={{
              padding: "7px 16px", borderRadius: 5, fontSize: 12, fontWeight: 600,
              border: `1.5px solid ${method === m.val ? COLORS.navy : COLORS.border}`,
              background: method === m.val ? COLORS.navy : "transparent",
              color: method === m.val ? "#FFF" : COLORS.textMuted, cursor: "pointer",
            }}>{m.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {method === "monetary" ? (
            <>
              <label style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 600 }}>기준 금액 (장부가 이상 전수조사)</label>
              <input type="number" value={threshold} onChange={e => setThreshold(Number(e.target.value))}
                style={{ width: 160, padding: "7px 10px", borderRadius: 4, border: `1.5px solid ${COLORS.border}`, fontSize: 13, fontVariantNumeric: "tabular-nums" }} />
              <span style={{ fontSize: 12, color: COLORS.textMuted }}>원 이상</span>
            </>
          ) : (
            <>
              <label style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 600 }}>샘플링 비율</label>
              <input type="range" min={5} max={100} value={sampleRate} onChange={e => setSampleRate(Number(e.target.value))}
                style={{ width: 120 }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy, fontVariantNumeric: "tabular-nums", minWidth: 40 }}>{sampleRate}%</span>
            </>
          )}
          <button onClick={runSampling} style={{
            marginLeft: "auto", padding: "8px 20px", borderRadius: 5, background: COLORS.amber,
            color: "#FFF", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>샘플 추출</button>
          <button onClick={clearSampling} style={{
            padding: "8px 16px", borderRadius: 5, background: "transparent",
            border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, fontSize: 13, cursor: "pointer",
          }}>초기화</button>
        </div>
      </div>

      {/* 모집단 테이블 */}
      <div style={{ background: COLORS.bgCard, borderRadius: 8, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: COLORS.navyMid }}>
              {["샘플", "품목코드", "품명", "카테고리", "보관위치", "수량", "단가", "장부가"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: h === "수량" || h === "단가" || h === "장부가" ? "right" : "left", color: "#B8C8DC", fontWeight: 700, fontSize: 11, letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {population.map((item, i) => (
              <tr key={item.id} style={{
                borderBottom: `1px solid ${COLORS.border}`,
                background: item.sampled ? "#FFFBF0" : (i % 2 === 0 ? COLORS.bgCard : "#F8FAFB"),
              }}>
                <td style={{ padding: "10px 14px" }}>
                  {item.sampled ? (
                    <span style={{ display: "inline-block", width: 20, height: 20, background: COLORS.amber, borderRadius: "50%", fontSize: 10, color: "#FFF", textAlign: "center", lineHeight: "20px", fontWeight: 700 }}>✓</span>
                  ) : (
                    <span style={{ display: "inline-block", width: 20, height: 20, border: `2px solid ${COLORS.border}`, borderRadius: "50%" }} />
                  )}
                </td>
                <td style={{ padding: "10px 14px", color: COLORS.steel, fontFamily: "monospace", fontSize: 11 }}>{item.id}</td>
                <td style={{ padding: "10px 14px", fontWeight: 500, color: COLORS.text }}>{item.name}</td>
                <td style={{ padding: "10px 14px" }}><Badge>{item.category}</Badge></td>
                <td style={{ padding: "10px 14px", color: COLORS.textMuted }}>{item.location}</td>
                <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(item.qty)}</td>
                <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: COLORS.textMuted }}>{fmt(item.unitCost)}</td>
                <td style={{ padding: "10px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: COLORS.navy }}>{fmtKRW(item.totalCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── 탭 4: 실사 결과 입력 ─────────────────────────────────────────
const TabInput = ({ population }) => {
  const sampledItems = population.filter(p => p.sampled);
  const [results, setResults] = useState({});
  const [approvals, setApprovals] = useState({});

  const getResult = (id) => results[id] || { countedQty: "", note: "", submitted: false };
  const updateResult = (id, key, val) => setResults(prev => ({ ...prev, [id]: { ...getResult(id), [key]: val } }));

  const submitItem = (id) => {
    const r = getResult(id);
    if (r.countedQty === "") return;
    setResults(prev => ({ ...prev, [id]: { ...r, submitted: true } }));
    setApprovals(prev => ({ ...prev, [id]: "pending" }));
  };

  const approveItem = (id, decision) => setApprovals(prev => ({ ...prev, [id]: decision }));

  const submittedCount = Object.values(results).filter(r => r.submitted).length;
  const approvedCount = Object.values(approvals).filter(a => a === "approved").length;

  if (sampledItems.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 40 }}>📋</div>
        <div style={{ fontSize: 15, color: COLORS.textMuted, fontWeight: 600 }}>샘플링된 품목이 없습니다</div>
        <div style={{ fontSize: 13, color: COLORS.textMuted }}>먼저 [모집단 & 샘플링] 탭에서 샘플을 추출하세요</div>
      </div>
    );
  }

  return (
    <div>
      {/* 진행 상황 */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
        {[
          { label: "샘플 총계", value: sampledItems.length, color: COLORS.navy },
          { label: "입력 완료", value: submittedCount, color: COLORS.amber },
          { label: "결재 완료", value: approvedCount, color: COLORS.green },
          { label: "미입력", value: sampledItems.length - submittedCount, color: COLORS.red },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: COLORS.bgCard, borderRadius: 8, padding: "14px 18px", border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 700, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* 진행 바 */}
      <div style={{ background: COLORS.bgCard, borderRadius: 8, padding: "14px 20px", border: `1px solid ${COLORS.border}`, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>
          <span>전체 진행률</span>
          <span style={{ fontWeight: 700, color: COLORS.navy }}>
            {sampledItems.length ? Math.round(approvedCount / sampledItems.length * 100) : 0}%
          </span>
        </div>
        <div style={{ height: 8, background: COLORS.border, borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${COLORS.amber}, ${COLORS.green})`,
            width: `${sampledItems.length ? approvedCount / sampledItems.length * 100 : 0}%`,
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      {/* 품목 카드 */}
      <div style={{ display: "grid", gap: 12 }}>
        {sampledItems.map(item => {
          const r = getResult(item.id);
          const approval = approvals[item.id];
          const diff = r.submitted && r.countedQty !== "" ? Number(r.countedQty) - item.qty : null;
          const diffPct = diff !== null && item.qty ? (diff / item.qty * 100).toFixed(1) : null;

          return (
            <div key={item.id} style={{
              background: COLORS.bgCard, borderRadius: 8, border: `1.5px solid ${approval === "approved" ? COLORS.green : approval === "rejected" ? COLORS.red : r.submitted ? COLORS.amber : COLORS.border}`,
              padding: 18, transition: "border-color 0.2s",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                {/* 품목 정보 */}
                <div style={{ flex: "0 0 280px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: COLORS.steel }}>{item.id}</span>
                    <Badge>{item.category}</Badge>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy, marginBottom: 4 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted }}>{item.location}</div>
                  <div style={{ fontSize: 13, color: COLORS.text, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
                    장부 수량: <strong>{fmt(item.qty)}</strong>
                  </div>
                </div>

                {/* 입력 영역 */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: COLORS.textMuted, marginBottom: 5 }}>실사 수량 (카운팅)</label>
                      <input
                        type="number" value={r.countedQty}
                        onChange={e => updateResult(item.id, "countedQty", e.target.value)}
                        disabled={r.submitted}
                        placeholder="0"
                        style={{
                          width: 120, padding: "8px 12px", borderRadius: 5,
                          border: `1.5px solid ${COLORS.border}`, fontSize: 14,
                          fontVariantNumeric: "tabular-nums", fontWeight: 600,
                          background: r.submitted ? "#F5F7FA" : "#FFF",
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: COLORS.textMuted, marginBottom: 5 }}>비고</label>
                      <input
                        type="text" value={r.note}
                        onChange={e => updateResult(item.id, "note", e.target.value)}
                        disabled={r.submitted}
                        placeholder="특이사항 입력"
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 5, border: `1.5px solid ${COLORS.border}`, fontSize: 13, boxSizing: "border-box", background: r.submitted ? "#F5F7FA" : "#FFF" }}
                      />
                    </div>
                    {!r.submitted ? (
                      <button onClick={() => submitItem(item.id)} style={{
                        padding: "8px 16px", borderRadius: 5, background: COLORS.navy,
                        color: "#FFF", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                      }}>결재 요청</button>
                    ) : (
                      <div style={{ display: "flex", gap: 6 }}>
                        {approval !== "approved" && approval !== "rejected" && (
                          <>
                            <button onClick={() => approveItem(item.id, "approved")} style={{ padding: "8px 14px", borderRadius: 5, background: COLORS.green, color: "#FFF", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>승인</button>
                            <button onClick={() => approveItem(item.id, "rejected")} style={{ padding: "8px 14px", borderRadius: 5, background: COLORS.red, color: "#FFF", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>반려</button>
                          </>
                        )}
                        {approval === "approved" && <Badge color="green">결재완료</Badge>}
                        {approval === "rejected" && <Badge color="red">반려</Badge>}
                      </div>
                    )}
                  </div>
                </div>

                {/* 차이 표시 */}
                {diff !== null && (
                  <div style={{
                    flex: "0 0 120px", textAlign: "right", padding: "8px 0",
                  }}>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 700, marginBottom: 4 }}>차이 (실사 - 장부)</div>
                    <div style={{
                      fontSize: 18, fontWeight: 800, fontVariantNumeric: "tabular-nums",
                      color: diff === 0 ? COLORS.green : diff > 0 ? COLORS.steel : COLORS.red,
                    }}>
                      {diff > 0 ? "+" : ""}{fmt(diff)}
                    </div>
                    <div style={{ fontSize: 11, color: diff === 0 ? COLORS.green : COLORS.red, fontWeight: 600 }}>
                      {diffPct}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── 탭 5: 결과 현황 ─────────────────────────────────────────────
const TabResults = ({ population }) => {
  const sampledItems = population.filter(p => p.sampled);
  const total = population.length;
  const sampled = sampledItems.length;
  const totalVal = population.reduce((s, p) => s + p.totalCost, 0);
  const sampledVal = sampledItems.reduce((s, p) => s + p.totalCost, 0);

  const byCat = useMemo(() => {
    const map = {};
    population.forEach(p => {
      if (!map[p.category]) map[p.category] = { total: 0, sampled: 0, value: 0 };
      map[p.category].total++;
      map[p.category].value += p.totalCost;
      if (p.sampled) map[p.category].sampled++;
    });
    return Object.entries(map).sort((a, b) => b[1].value - a[1].value);
  }, [population]);

  const byLocation = useMemo(() => {
    const map = {};
    population.forEach(p => {
      const loc = p.location.split(" ")[0];
      if (!map[loc]) map[loc] = { total: 0, sampled: 0 };
      map[loc].total++;
      if (p.sampled) map[loc].sampled++;
    });
    return Object.entries(map);
  }, [population]);

  return (
    <div>
      {/* 핵심 지표 */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
        {[
          { label: "모집단 규모", value: fmt(total), unit: "건", sub: `${fmtKRW(totalVal)}원`, color: COLORS.navy },
          { label: "샘플 선정", value: fmt(sampled), unit: "건", sub: `${sampled ? (sampled / total * 100).toFixed(0) : 0}% 커버리지`, color: COLORS.amber },
          { label: "샘플 장부가 합계", value: fmtKRW(sampledVal), unit: "원", sub: `전체의 ${totalVal ? (sampledVal / totalVal * 100).toFixed(0) : 0}%`, color: COLORS.steel },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: COLORS.bgCard, borderRadius: 8, padding: "18px 22px", border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 700, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontVariantNumeric: "tabular-nums" }}>
              {s.value}<span style={{ fontSize: 12, fontWeight: 400, color: COLORS.textMuted, marginLeft: 4 }}>{s.unit}</span>
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* 카테고리별 */}
        <div style={{ background: COLORS.bgCard, borderRadius: 8, border: `1px solid ${COLORS.border}`, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.navy, marginBottom: 16, letterSpacing: "0.05em" }}>카테고리별 샘플링 현황</div>
          {byCat.map(([cat, d]) => (
            <div key={cat} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                <span style={{ fontWeight: 600, color: COLORS.text }}>{cat}</span>
                <span style={{ color: COLORS.textMuted, fontVariantNumeric: "tabular-nums" }}>
                  {d.sampled}/{d.total}건 · {fmtKRW(d.value)}원
                </span>
              </div>
              <div style={{ height: 6, background: COLORS.border, borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%", background: COLORS.amber, borderRadius: 3,
                  width: `${d.total ? d.sampled / d.total * 100 : 0}%`, transition: "width 0.4s",
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* 사업장별 */}
        <div style={{ background: COLORS.bgCard, borderRadius: 8, border: `1px solid ${COLORS.border}`, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.navy, marginBottom: 16, letterSpacing: "0.05em" }}>사업장별 샘플링 현황</div>
          {byLocation.map(([loc, d]) => (
            <div key={loc} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ flex: "0 0 80px", fontSize: 13, fontWeight: 600, color: COLORS.text }}>{loc}</div>
              <div style={{ flex: 1, height: 20, background: COLORS.border, borderRadius: 3, overflow: "hidden", position: "relative" }}>
                <div style={{
                  height: "100%", background: `linear-gradient(90deg, ${COLORS.navyLight}, ${COLORS.steelLight})`,
                  width: `${d.total ? d.sampled / d.total * 100 : 0}%`, borderRadius: 3, transition: "width 0.4s",
                }} />
              </div>
              <div style={{ flex: "0 0 70px", textAlign: "right", fontSize: 12, color: COLORS.textMuted, fontVariantNumeric: "tabular-nums" }}>
                {d.sampled}/{d.total}건
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 상세 모집단 요약 테이블 */}
      <div style={{ background: COLORS.bgCard, borderRadius: 8, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 12, fontWeight: 700, color: COLORS.navy }}>
          전체 모집단 요약
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#F3F6FA" }}>
              {["품목코드", "품명", "카테고리", "보관위치", "장부 수량", "장부가", "샘플 여부"].map(h => (
                <th key={h} style={{ padding: "9px 14px", textAlign: h.includes("수량") || h.includes("장부가") ? "right" : "left", color: COLORS.textMuted, fontWeight: 700, fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {population.map((item, i) => (
              <tr key={item.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: item.sampled ? "#FFFBF0" : (i % 2 === 0 ? "#FFF" : "#F8FAFB") }}>
                <td style={{ padding: "9px 14px", fontFamily: "monospace", fontSize: 11, color: COLORS.steel }}>{item.id}</td>
                <td style={{ padding: "9px 14px", fontWeight: 500 }}>{item.name}</td>
                <td style={{ padding: "9px 14px" }}><Badge>{item.category}</Badge></td>
                <td style={{ padding: "9px 14px", color: COLORS.textMuted }}>{item.location}</td>
                <td style={{ padding: "9px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(item.qty)}</td>
                <td style={{ padding: "9px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{fmtKRW(item.totalCost)}</td>
                <td style={{ padding: "9px 14px" }}>
                  {item.sampled ? <Badge color="amber">샘플</Badge> : <span style={{ color: COLORS.border, fontSize: 11 }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── 메인 앱 ─────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [population, setPopulation] = useState(INITIAL_POPULATION);

  const tabs = [
    { label: "공지사항", icon: "📢" },
    { label: "인원 현황", icon: "👥" },
    { label: "모집단 & 샘플링", icon: "🎯" },
    { label: "결과 입력 / 결재", icon: "✏️" },
    { label: "전체 결과 현황", icon: "📊" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'Pretendard', 'Noto Sans KR', -apple-system, sans-serif" }}>
      {/* 헤더 */}
      <div style={{ background: COLORS.navy, padding: "0 32px", boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 32, height: 32, background: COLORS.amber, borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 900, color: COLORS.navy,
            }}>재</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#FFF", letterSpacing: "-0.01em" }}>재고실사 통합관리시스템</div>
              <div style={{ fontSize: 10, color: COLORS.steelLight, letterSpacing: "0.06em", marginTop: 1 }}>INVENTORY AUDIT MANAGEMENT · 재경팀</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Badge color="amber">2025 하반기 실사 진행중</Badge>
            <div style={{ fontSize: 11, color: COLORS.steelLight }}>D-5</div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div style={{ display: "flex", gap: 0 }}>
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              padding: "12px 20px", background: "transparent", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: activeTab === i ? 700 : 500,
              color: activeTab === i ? COLORS.amberLight : COLORS.steelLight,
              borderBottom: activeTab === i ? `2.5px solid ${COLORS.amber}` : "2.5px solid transparent",
              transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ fontSize: 14 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 컨텐츠 */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px" }}>
        {activeTab === 0 && <TabNotice />}
        {activeTab === 1 && <TabMembers />}
        {activeTab === 2 && <TabSampling population={population} setPopulation={setPopulation} />}
        {activeTab === 3 && <TabInput population={population} />}
        {activeTab === 4 && <TabResults population={population} />}
      </div>
    </div>
  );
}
