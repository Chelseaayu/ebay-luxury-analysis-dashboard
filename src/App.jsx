import { useEffect, useState } from 'react'
import {
  fetchSales, getMonthlyRevenue, getBrandRevenue, getCategoryRevenue,
  getTopStates, getAllStates, getBuyerSegments, getKPIs,
  getAuthComparison, getIntlVsDomestic, getProcessingDist, getMonthlyByBrand
} from './lib/queries'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, ScatterChart, Scatter
} from 'recharts'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { scaleLinear } from 'd3-scale'
import './index.css'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

const COLORS  = ['#b8860b','#6b5b3e','#4a7c9e','#5a8a5a','#8a5a7c','#9e6a4a','#4a9e8a','#8a8a3e']
const fmt     = n => n >= 1e6 ? `$${(n/1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n/1e3).toFixed(0)}K` : `$${n?.toFixed(0)}`
const fmtNum  = n => n?.toLocaleString()

// State abbreviation → FIPS code for react-simple-maps
const STATE_FIPS = {
  AL:'01',AK:'02',AZ:'04',AR:'05',CA:'06',CO:'08',CT:'09',DE:'10',
  FL:'12',GA:'13',HI:'15',ID:'16',IL:'17',IN:'18',IA:'19',KS:'20',
  KY:'21',LA:'22',ME:'23',MD:'24',MA:'25',MI:'26',MN:'27',MS:'28',
  MO:'29',MT:'30',NE:'31',NV:'32',NH:'33',NJ:'34',NM:'35',NY:'36',
  NC:'37',ND:'38',OH:'39',OK:'40',OR:'41',PA:'42',RI:'44',SC:'45',
  SD:'46',TN:'47',TX:'48',UT:'49',VT:'50',VA:'51',WA:'53',WV:'54',
  WI:'55',WY:'56',DC:'11',MP:'69',GU:'66',VI:'78',PR:'72',AS:'60'
}

const CONTENT = {
  en: {
    badge: 'Data Analyst Project',
    h1a: 'eBay Luxury Sales', h1b: 'Analytics Dashboard',
    pills: ['250+ Transactions','Jan – Dec 2024','$1M+ Revenue','Live from Supabase'],
    langBtn: '🇮🇩 Bahasa Indonesia',
    storyTitle: 'Project Background',
    storyP1: 'a****** is an eBay seller specialising in rare, authenticated luxury goods — Hermès Birkin & Kelly bags, Chanel apparel & accessories, Van Cleef & Arpels jewellery, Rolex watches, and Goyard totes. Every item undergoes eBay\'s Authenticity Verification before shipment.',
    storyP2: 'This project demonstrates a full end-to-end data pipeline answering three core business questions:',
    storyQ: ['Which brands and categories drive the most revenue?','Who are the highest-value buyers and how loyal are they?','What geographic and seasonal patterns exist?'],
    flowTitle: 'Analysis Pipeline',
    flowSteps: [
      { num:'01', title:'Raw Data', sub:'eBay CSV Export', details:['82 columns, 250+ rows','Raw transactional data','Semicolon-delimited format'] },
      { num:'02', title:'Data Cleaning', sub:'Python + Pandas', details:['Drop null & junk rows','Parse dates to datetime','Normalize price columns'] },
      { num:'03', title:'Feature Engineering', sub:'Regex + Mapping', details:['Extract brand via regex','Classify product category','Flag auth, promo, intl'] },
      { num:'04', title:'Database', sub:'Supabase (PostgreSQL)', details:['Upload via supabase-py','Row-level security (RLS)','REST API auto-generated'] },
      { num:'05', title:'Dashboard', sub:'React + Recharts', details:['9 interactive charts','US choropleth map','Bilingual EN / ID'] },
      { num:'06', title:'Deploy', sub:'Vercel', details:['CI/CD from GitHub','Edge network CDN','Custom domain ready'] },
    ],
    kpiTitle: 'Key Performance Indicators',
    kpis: [
      { label:'Total Revenue', sub:'Jan–Dec 2024' },
      { label:'Total Orders', sub:'transactions' },
      { label:'Avg Order Value', sub:'per transaction' },
      { label:'Unique Buyers', sub:'customers' },
      { label:'Repeat Buyer Rate', sub:'purchased 2+ times' },
      { label:'Auth Pass Rate', sub:'items verified' },
      { label:'International', sub:'of all orders' },
    ],
    c1title:'Monthly Revenue & Order Volume', c1sub:'2024 full-year trend',
    c1rev:'Revenue', c1ord:'Orders',
    c2atitle:'Revenue by Brand', c2asub:'Total revenue contribution per luxury brand',
    c2btitle:'Revenue by Category', c2bsub:'Product category performance',
    c2rev:'Revenue',
    c3title:'Monthly Revenue Stack by Brand', c3sub:"Each colour = a brand's contribution per month",
    c4maptitle:'US Revenue Heatmap', c4mapsub:'Darker = higher revenue · Hover a state for details',
    c4mapscale:'Color scale: light = low → gold = high revenue',
    c4bartitle:'Top 10 States by Revenue', c4barsub:'Domestic orders only',
    c4rev:'Revenue',
    c5atitle:'Buyer Segments — No. of Buyers', c5asub:'By purchase frequency',
    c5btitle:'Buyer Segments — Revenue Share', c5bsub:'Which segment generates most revenue',
    c5ctitle:'Domestic vs International', c5csub:'Revenue split',
    c5rev:'Revenue',
    c6atitle:'Auth Verification: Avg Sale Price', c6asub:'Does authentication correlate with higher prices?',
    c6avgprice:'Avg Price',
    c6btitle:'Order Fulfilment Speed', c6bsub:'Days from sale to shipment',
    c6orders:'Orders',
    mapOrders: 'orders',
    s1: 'Revenue Over Time', s1sub: 'Monthly revenue trend and order volume across 2024',
    s2: 'Revenue by Brand & Category', s2sub: 'Breakdown of sales across luxury brands and product types',
    s3: 'Stacked Monthly Revenue by Brand', s3sub: 'How each brand contributed to monthly revenue',
    s4: 'Geographic Distribution', s4sub: 'US state-level revenue heatmap and top markets',
    s5: 'Buyer Behaviour', s5sub: 'Segmentation, loyalty metrics, and repeat purchase analysis',
    s6: 'Operational Insights', s6sub: 'Authenticity verification, international vs domestic, fulfilment speed',
    insightTitle: 'Key Business Insights',
    insights: [
      { icon:'👑', title:'Hermès Dominates Revenue', text:'Hermès accounts for the largest revenue share, driven by ultra-high AOV items like Birkin and Kelly bags. Prioritising Hermès sourcing directly maximises returns.' },
      { icon:'📅', title:'Q4 is Peak Season', text:'Oct–Dec consistently shows the highest order volume. Inventory for holiday gifting should be secured by September.' },
      { icon:'💎', title:'VIP Buyers Drive Disproportionate Value', text:'A small group of repeat buyers (3+ orders) generates outsized revenue. These customers deserve priority outreach and early access.' },
      { icon:'🗺️', title:'CA, NY & FL Lead Geography', text:'Three states account for the majority of domestic revenue. Fast, reliable shipping to these markets is critical.' },
      { icon:'✅', title:'Authentication = Higher Prices', text:'Items with Passed authentication status command higher average prices and sell faster — a key trust signal for luxury buyers.' },
      { icon:'🌍', title:'International Demand is Real', text:'Buyers from UK, Australia, UAE and Asia show consistent purchasing patterns. Expanding international options could unlock significant upside.' },
    ],
    footerText: 'Data Analyst Project · Built with React, Recharts, react-simple-maps, Supabase & Vite',
  },
  id: {
    badge: 'Proyek Data Analyst',
    h1a: 'Analisis Penjualan Mewah', h1b: 'Dashboard eBay',
    pills: ['250+ Transaksi','Jan – Des 2024','Pendapatan $1M+','Data Langsung dari Supabase'],
    langBtn: '🇬🇧 English',
    storyTitle: 'Latar Belakang Proyek',
    storyP1: 'a****** adalah seller eBay yang mengkhususkan diri pada barang mewah langka dan terautentikasi — tas Hermès Birkin & Kelly, pakaian & aksesori Chanel, perhiasan Van Cleef & Arpels, jam tangan Rolex, dan tas Goyard. Setiap item melalui proses Verifikasi Keaslian eBay.',
    storyP2: 'Proyek ini mendemonstrasikan pipeline data end-to-end untuk menjawab tiga pertanyaan bisnis utama:',
    storyQ: ['Brand dan kategori mana yang menghasilkan revenue terbesar?','Siapa pembeli bernilai tertinggi dan seberapa loyal mereka?','Pola geografis dan musiman apa yang ada?'],
    flowTitle: 'Pipeline Analisis',
    flowSteps: [
      { num:'01', title:'Data Mentah', sub:'Ekspor CSV eBay', details:['82 kolom, 250+ baris','Data transaksi mentah','Format semicolon-delimited'] },
      { num:'02', title:'Pembersihan Data', sub:'Python + Pandas', details:['Hapus baris null & junk','Parse tanggal ke datetime','Normalisasi kolom harga'] },
      { num:'03', title:'Rekayasa Fitur', sub:'Regex + Pemetaan', details:['Ekstrak brand via regex','Klasifikasi kategori produk','Tandai auth, promo, intl'] },
      { num:'04', title:'Database', sub:'Supabase (PostgreSQL)', details:['Upload via supabase-py','Row-level security (RLS)','REST API otomatis tersedia'] },
      { num:'05', title:'Dashboard', sub:'React + Recharts', details:['9 chart interaktif','Peta koropleth AS','Dwibahasa EN / ID'] },
      { num:'06', title:'Deploy', sub:'Vercel', details:['CI/CD dari GitHub','Edge network CDN','Siap domain kustom'] },
    ],
    kpiTitle: 'Indikator Kinerja Utama',
    kpis: [
      { label:'Total Pendapatan', sub:'Jan–Des 2024' },
      { label:'Total Pesanan', sub:'transaksi' },
      { label:'Rata-rata Nilai Pesanan', sub:'per transaksi' },
      { label:'Pembeli Unik', sub:'pelanggan' },
      { label:'Tingkat Pembeli Berulang', sub:'beli 2+ kali' },
      { label:'Tingkat Lulus Autentikasi', sub:'item terverifikasi' },
      { label:'Internasional', sub:'dari semua pesanan' },
    ],
    c1title:'Revenue Bulanan & Volume Pesanan', c1sub:'Tren sepanjang tahun 2024',
    c1rev:'Pendapatan', c1ord:'Pesanan',
    c2atitle:'Pendapatan per Brand', c2asub:'Kontribusi revenue total per brand mewah',
    c2btitle:'Pendapatan per Kategori', c2bsub:'Performa kategori produk',
    c2rev:'Pendapatan',
    c3title:'Revenue Bulanan Bertumpuk per Brand', c3sub:'Setiap warna = kontribusi brand per bulan',
    c4maptitle:'Peta Panas Revenue AS', c4mapsub:'Lebih gelap = revenue lebih tinggi · Hover state untuk detail',
    c4mapscale:'Skala warna: terang = rendah → emas = revenue tinggi',
    c4bartitle:'10 Negara Bagian Teratas by Revenue', c4barsub:'Pesanan domestik saja',
    c4rev:'Pendapatan',
    c5atitle:'Segmen Pembeli — Jumlah Pembeli', c5asub:'Berdasarkan frekuensi pembelian',
    c5btitle:'Segmen Pembeli — Porsi Revenue', c5bsub:'Segmen mana yang menghasilkan paling banyak',
    c5ctitle:'Domestik vs Internasional', c5csub:'Pembagian revenue',
    c5rev:'Pendapatan',
    c6atitle:'Verifikasi Autentikasi: Rata-rata Harga Jual', c6asub:'Apakah autentikasi berkorelasi dengan harga lebih tinggi?',
    c6avgprice:'Rata-rata Harga',
    c6btitle:'Kecepatan Pemenuhan Pesanan', c6bsub:'Hari dari penjualan ke pengiriman',
    c6orders:'Pesanan',
    mapOrders: 'pesanan',
    s1: 'Revenue Sepanjang Waktu', s1sub: 'Tren revenue bulanan dan volume pesanan selama 2024',
    s2: 'Revenue per Brand & Kategori', s2sub: 'Breakdown penjualan per brand dan jenis produk mewah',
    s3: 'Revenue Bulanan Bertumpuk per Brand', s3sub: 'Kontribusi setiap brand terhadap revenue bulanan',
    s4: 'Distribusi Geografis', s4sub: 'Heatmap revenue per negara bagian AS dan pasar utama',
    s5: 'Perilaku Pembeli', s5sub: 'Segmentasi, metrik loyalitas, dan analisis pembelian berulang',
    s6: 'Insight Operasional', s6sub: 'Verifikasi keaslian, internasional vs domestik, kecepatan pengiriman',
    insightTitle: 'Insight Bisnis Utama',
    insights: [
      { icon:'👑', title:'Hermès Mendominasi Revenue', text:'Hermès menyumbang porsi revenue terbesar lewat item AOV sangat tinggi seperti Birkin dan Kelly. Memprioritaskan pengadaan Hermès memaksimalkan keuntungan.' },
      { icon:'📅', title:'Q4 adalah Puncak Musim', text:'Okt–Des secara konsisten menunjukkan volume pesanan tertinggi. Inventaris untuk hadiah liburan harus diamankan sebelum September.' },
      { icon:'💎', title:'Pembeli VIP Menghasilkan Nilai Luar Biasa', text:'Sekelompok kecil pembeli berulang (3+ pesanan) menghasilkan revenue yang tidak proporsional. Mereka perlu mendapat layanan prioritas.' },
      { icon:'🗺️', title:'CA, NY & FL Memimpin Geografi', text:'Tiga negara bagian menyumbang mayoritas revenue domestik. Pengiriman cepat dan andal ke pasar ini sangat krusial.' },
      { icon:'✅', title:'Autentikasi = Harga Lebih Tinggi', text:'Item dengan status autentikasi "Passed" memiliki harga rata-rata lebih tinggi dan terjual lebih cepat — sinyal kepercayaan kunci.' },
      { icon:'🌍', title:'Permintaan Internasional Nyata', text:'Pembeli dari UK, Australia, UAE, dan Asia menunjukkan pola pembelian konsisten. Memperluas opsi pengiriman internasional berpotensi besar.' },
    ],
    footerText: 'Data Analyst Project · Dibangun dengan React, Recharts, react-simple-maps, Supabase & Vite',
  }
}

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff', border:'1px solid #e8e4dc', borderRadius:8, padding:'10px 14px', fontSize:12, boxShadow:'0 4px 12px rgba(0,0,0,0.08)' }}>
      {label && <p style={{ color:'#999', marginBottom:4, fontSize:11 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#b8860b', fontWeight:500 }}>
          {p.name}: {typeof p.value === 'number' && p.value > 500 ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

function USMap({ stateMap, ordersLabel }) {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null })

  const values = Object.values(stateMap).map(d => d.revenue)
  const max = Math.max(...values, 1)
  const colorScale = scaleLinear().domain([0, max]).range(['#fdf6e3', '#b8860b'])

  const handleMove = (geo, evt) => {
    const fips = geo.id?.toString().padStart(2, '0')
    const abbr = Object.keys(STATE_FIPS).find(k => STATE_FIPS[k] === fips)
    const d = abbr ? stateMap[abbr] : null
    const rect = evt.currentTarget.closest('.map-wrap').getBoundingClientRect()
    setTooltip({
      visible: true,
      x: evt.clientX - rect.left + 12,
      y: evt.clientY - rect.top - 10,
      content: d
        ? { state: abbr, revenue: fmt(d.revenue), orders: d.orders }
        : { state: abbr || 'Unknown', revenue: '$0', orders: 0 }
    })
  }

  const handleLeave = () => setTooltip(t => ({ ...t, visible: false }))

  return (
    <div className="map-wrap" style={{ position: 'relative' }}>
      <ComposableMap projection="geoAlbersUsa" style={{ width:'100%', height:'auto' }}>
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => {
              const fips = geo.id?.toString().padStart(2, '0')
              const abbr = Object.keys(STATE_FIPS).find(k => STATE_FIPS[k] === fips)
              const d = abbr ? stateMap[abbr] : null
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={d ? colorScale(d.revenue) : '#ede9e0'}
                  stroke="#fff"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover:   { fill: '#d4a017', outline: 'none', cursor: 'pointer' },
                    pressed: { outline: 'none' }
                  }}
                  onMouseMove={evt => handleMove(geo, evt)}
                  onMouseLeave={handleLeave}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>

      {tooltip.visible && tooltip.content && (
        <div style={{
          position: 'absolute',
          left: tooltip.x,
          top: tooltip.y,
          background: '#fff',
          border: '1px solid #e8e4dc',
          borderRadius: 8,
          padding: '10px 14px',
          pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          zIndex: 999,
          minWidth: 140,
        }}>
          <p style={{ fontWeight: 600, fontSize: 13, color: '#111', marginBottom: 4 }}>
            {tooltip.content.state}
          </p>
          <p style={{ fontSize: 13, color: '#b8860b', fontWeight: 600 }}>
            {tooltip.content.revenue}
          </p>
          <p style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
            {tooltip.content.orders} {ordersLabel}{tooltip.content.orders !== 1 ? '' : ''}
          </p>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [lang, setLang]         = useState('en')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [kpis, setKpis]         = useState(null)
  const [monthly, setMonthly]   = useState([])
  const [brands, setBrands]     = useState([])
  const [cats, setCats]         = useState([])
  const [states, setStates]     = useState([])
  const [stateMap, setStateMap] = useState({})
  const [segments, setSegments] = useState([])
  const [auth, setAuth]         = useState([])
  const [intl, setIntl]         = useState([])
  const [proc, setProc]         = useState([])
  const [monthBrand, setMonthBrand] = useState({ data:[], brands:[] })

  const t = CONTENT[lang]

  useEffect(() => {
    fetchSales().then(data => {
      setKpis(getKPIs(data))
      setMonthly(getMonthlyRevenue(data))
      setBrands(getBrandRevenue(data))
      setCats(getCategoryRevenue(data))
      setStates(getTopStates(data))
      setStateMap(getAllStates(data))
      setSegments(getBuyerSegments(data))
      setAuth(getAuthComparison(data))
      setIntl(getIntlVsDomestic(data))
      setProc(getProcessingDist(data))
      setMonthBrand(getMonthlyByBrand(data))
      setLoading(false)
    }).catch(e => { setError(e.message); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="loading">
      <div className="spinner" />
      <p style={{ fontSize:13 }}>Loading data from Supabase…</p>
    </div>
  )
  if (error) return (
    <div className="loading">
      <p style={{ color:'#c0392b', fontSize:14 }}>⚠ {error}</p>
      <p style={{ fontSize:12, color:'#999' }}>Check .env.local credentials</p>
    </div>
  )

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="header-logo">✦ Luxury Analytics</div>
        <button className="lang-btn" onClick={() => setLang(l => l==='en'?'id':'en')}>{t.langBtn}</button>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">✦ {t.badge}</div>
        <h1>{t.h1a} <em>{t.h1b}</em></h1>
        <div className="hero-meta">
          {t.pills.map((p,i) => <div className="hero-pill" key={i}><span>·</span> {p}</div>)}
        </div>
      </section>

      {/* STORY */}
      <div className="story">
        <h2>{t.storyTitle}</h2>
        <p>{t.storyP1}</p>
        <p>{t.storyP2}</p>
        <ul>{t.storyQ.map((q,i) => <li key={i}>{q}</li>)}</ul>
      </div>

      {/* PIPELINE */}
      <section className="section">
        <div className="section-header"><h2>{t.flowTitle}</h2></div>
        <div className="chart-card">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:16 }}>
            {t.flowSteps.map((step, i) => (
              <div key={i} style={{ background:'#faf9f6', border:'1px solid #e8e4dc', borderRadius:10, padding:'16px 18px', position:'relative' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#d4a017', letterSpacing:2, marginBottom:6 }}>{step.num}</div>
                <div style={{ fontSize:14, fontWeight:600, color:'#111', marginBottom:2 }}>{step.title}</div>
                <div style={{ fontSize:12, color:'#b8860b', marginBottom:10, fontWeight:500 }}>{step.sub}</div>
                <ul style={{ padding:0, margin:0, listStyle:'none' }}>
                  {step.details.map((d,j) => (
                    <li key={j} style={{ fontSize:11, color:'#888', marginBottom:3, paddingLeft:12, position:'relative' }}>
                      <span style={{ position:'absolute', left:0, color:'#d4a017' }}>·</span>{d}
                    </li>
                  ))}
                </ul>
                {i < t.flowSteps.length-1 && (
                  <div style={{ position:'absolute', right:-10, top:'50%', transform:'translateY(-50%)', color:'#d4a017', fontSize:16, zIndex:1, display:'none' }}>→</div>
                )}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:16, flexWrap:'wrap' }}>
            <span style={{ fontSize:11, color:'#aaa', marginRight:4 }}>Stack:</span>
            {['Python','Pandas','Supabase (PostgreSQL)','React 18','Recharts','react-simple-maps','Vite','Vercel'].map(s => (
              <span className="stack-badge" key={s}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="section">
        <div className="section-header"><h2>{t.kpiTitle}</h2></div>
        <div className="kpi-grid">
          {[
            { label:t.kpis[0].label, value: fmt(kpis.totalRevenue),           sub:t.kpis[0].sub },
            { label:t.kpis[1].label, value: fmtNum(kpis.totalOrders),         sub:t.kpis[1].sub },
            { label:t.kpis[2].label, value: fmt(kpis.aov),                    sub:t.kpis[2].sub },
            { label:t.kpis[3].label, value: fmtNum(kpis.totalBuyers),         sub:t.kpis[3].sub },
            { label:t.kpis[4].label, value:`${kpis.repeatRate.toFixed(1)}%`,  sub:t.kpis[4].sub },
            { label:t.kpis[5].label, value:`${kpis.authRate.toFixed(1)}%`,    sub:t.kpis[5].sub },
            { label:t.kpis[6].label, value:`${kpis.intlRate.toFixed(1)}%`,    sub:t.kpis[6].sub },
          ].map((k,i) => (
            <div className="kpi-card" key={i}>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 1: Revenue Over Time */}
      <section className="section">
        <div className="section-header"><h2>{t.s1}</h2><p>{t.s1sub}</p></div>
        <div className="chart-card chart-full">
          <div className="chart-card-title">{t.c1title}</div>
          <div className="chart-card-sub">{t.c1sub}</div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b8860b" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#b8860b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="month" tick={{ fontSize:11 }} stroke="#ccc" />
              <YAxis yAxisId="l" tickFormatter={v=>fmt(v)} tick={{ fontSize:10 }} stroke="#ccc" />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize:10 }} stroke="#ccc" />
              <Tooltip content={<Tip />} />
              <Legend />
              <Area yAxisId="l" type="monotone" dataKey="revenue" name={t.c1rev} stroke="#b8860b" fill="url(#revGrad)" strokeWidth={2} dot={{ r:4, fill:'#b8860b' }} />
              <Line yAxisId="r" type="monotone" dataKey="orders" name={t.c1ord} stroke="#4a7c9e" strokeWidth={2} dot={{ r:3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* SECTION 2: Brand + Category */}
      <section className="section">
        <div className="section-header"><h2>{t.s2}</h2><p>{t.s2sub}</p></div>
        <div className="chart-grid-2">
          <div className="chart-card">
            <div className="chart-card-title">{t.c2atitle}</div>
            <div className="chart-card-sub">{t.c2asub}</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={brands} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" horizontal={false} />
                <XAxis type="number" tickFormatter={v=>fmt(v)} stroke="#ccc" tick={{ fontSize:10 }} />
                <YAxis type="category" dataKey="brand" stroke="#ccc" tick={{ fontSize:11 }} width={88} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="revenue" name={t.c2rev} radius={[0,5,5,0]}>
                  {brands.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <div className="chart-card-title">{t.c2btitle}</div>
            <div className="chart-card-sub">{t.c2bsub}</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cats} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" horizontal={false} />
                <XAxis type="number" tickFormatter={v=>fmt(v)} stroke="#ccc" tick={{ fontSize:10 }} />
                <YAxis type="category" dataKey="category" stroke="#ccc" tick={{ fontSize:11 }} width={88} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="revenue" name={t.c2rev} radius={[0,5,5,0]}>
                  {cats.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* SECTION 3: Stacked Monthly by Brand */}
      <section className="section">
        <div className="section-header"><h2>{t.s3}</h2><p>{t.s3sub}</p></div>
        <div className="chart-card chart-full">
          <div className="chart-card-title">{t.c3title}</div>
          <div className="chart-card-sub">{t.c3sub}</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthBrand.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="month" tick={{ fontSize:10 }} stroke="#ccc" />
              <YAxis tickFormatter={v=>fmt(v)} tick={{ fontSize:10 }} stroke="#ccc" />
              <Tooltip content={<Tip />} />
              <Legend />
              {monthBrand.brands.map((b,i) => (
                <Bar key={b} dataKey={b} stackId="a" fill={COLORS[i%COLORS.length]} radius={i===monthBrand.brands.length-1?[3,3,0,0]:[0,0,0,0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* SECTION 4: Geographic */}
      <section className="section">
        <div className="section-header"><h2>{t.s4}</h2><p>{t.s4sub}</p></div>
        <div className="chart-grid-2">
          <div className="chart-card" style={{ gridColumn:'1 / -1' }}>
            <div className="chart-card-title">{t.c4maptitle}</div>
            <div className="chart-card-sub">{t.c4mapsub}</div>
            <USMap stateMap={stateMap} ordersLabel={t.mapOrders} />
            <p style={{ fontSize:11, color:'#bbb', marginTop:8 }}>{t.c4mapscale}</p>
          </div>
        </div>
        <div style={{ marginTop:20 }}>
          <div className="chart-card">
            <div className="chart-card-title">{t.c4bartitle}</div>
            <div className="chart-card-sub">{t.c4barsub}</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={states} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis dataKey="state" tick={{ fontSize:11 }} stroke="#ccc" />
                <YAxis tickFormatter={v=>fmt(v)} tick={{ fontSize:10 }} stroke="#ccc" />
                <Tooltip content={<Tip />} />
                <Bar dataKey="revenue" name={t.c4rev} radius={[5,5,0,0]}>
                  {states.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* SECTION 5: Buyer Behaviour */}
      <section className="section">
        <div className="section-header"><h2>{t.s5}</h2><p>{t.s5sub}</p></div>
        <div className="chart-grid-3">
          <div className="chart-card">
            <div className="chart-card-title">{t.c5atitle}</div>
            <div className="chart-card-sub">{t.c5asub}</div>
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={segments} dataKey="buyers" nameKey="segment" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                  {segments.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip content={<Tip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <div className="chart-card-title">{t.c5btitle}</div>
            <div className="chart-card-sub">{t.c5bsub}</div>
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={segments} dataKey="revenue" nameKey="segment" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                  {segments.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip content={<Tip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <div className="chart-card-title">{t.c5ctitle}</div>
            <div className="chart-card-sub">{t.c5csub}</div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={intl} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis dataKey="label" tick={{ fontSize:11 }} stroke="#ccc" />
                <YAxis tickFormatter={v=>fmt(v)} tick={{ fontSize:10 }} stroke="#ccc" />
                <Tooltip content={<Tip />} />
                <Bar dataKey="revenue" name={t.c5rev} radius={[5,5,0,0]}>
                  {intl.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* SECTION 6: Operational */}
      <section className="section">
        <div className="section-header"><h2>{t.s6}</h2><p>{t.s6sub}</p></div>
        <div className="chart-grid-2">
          <div className="chart-card">
            <div className="chart-card-title">{t.c6atitle}</div>
            <div className="chart-card-sub">{t.c6asub}</div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={auth} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis dataKey="label" tick={{ fontSize:11 }} stroke="#ccc" />
                <YAxis tickFormatter={v=>fmt(v)} tick={{ fontSize:10 }} stroke="#ccc" />
                <Tooltip content={<Tip />} />
                <Bar dataKey="avgPrice" name={t.c6avgprice} radius={[5,5,0,0]}>
                  {auth.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <div className="chart-card-title">{t.c6btitle}</div>
            <div className="chart-card-sub">{t.c6bsub}</div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={proc} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis dataKey="label" tick={{ fontSize:11 }} stroke="#ccc" />
                <YAxis tick={{ fontSize:10 }} stroke="#ccc" />
                <Tooltip content={<Tip />} />
                <Bar dataKey="count" name={t.c6orders} radius={[5,5,0,0]}>
                  {proc.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* INSIGHTS */}
      <section className="section">
        <div className="section-header"><h2>{t.insightTitle}</h2></div>
        <div className="insight-grid">
          {t.insights.map((ins,i) => (
            <div className="insight-card" key={i}>
              <div className="insight-card-icon">{ins.icon}</div>
              <h4>{ins.title}</h4>
              <p>{ins.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>{t.footerText}</p>
        <p style={{ marginTop:4 }}>Data: eBay Orders Report 2024 · Seller: a******</p>
      </footer>
    </div>
  )
}
