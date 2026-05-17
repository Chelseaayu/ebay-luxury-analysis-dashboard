import { supabase } from './supabase'

// Fetch all rows needed for dashboard (only relevant columns)
export async function fetchSales() {
  const { data, error } = await supabase
    .from('sales')
    .select('price, sale_date, month_num, brand, category, buyer_state, buyer_country, auth_passed, is_promoted, is_intl, processing_days, buyer_username')
    .not('price', 'is', null)
    .order('sale_date', { ascending: true })

  if (error) throw error
  return data
}

// Aggregate: monthly revenue
export function getMonthlyRevenue(data) {
  const map = {}
  data.forEach(row => {
    const m = row.month_num?.slice(0, 7) // "2024-01"
    if (!m) return
    if (!map[m]) map[m] = { month: m, revenue: 0, orders: 0 }
    map[m].revenue += row.price || 0
    map[m].orders += 1
  })
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month))
}

// Aggregate: revenue by brand
export function getBrandRevenue(data) {
  const map = {}
  data.forEach(row => {
    const b = row.brand || 'Other'
    if (!map[b]) map[b] = { brand: b, revenue: 0, orders: 0 }
    map[b].revenue += row.price || 0
    map[b].orders += 1
  })
  return Object.values(map).sort((a, b) => b.revenue - a.revenue)
}

// Aggregate: revenue by category
export function getCategoryRevenue(data) {
  const map = {}
  data.forEach(row => {
    const c = row.category || 'Other'
    if (!map[c]) map[c] = { category: c, revenue: 0, orders: 0 }
    map[c].revenue += row.price || 0
    map[c].orders += 1
  })
  return Object.values(map).sort((a, b) => b.revenue - a.revenue)
}

// Aggregate: top 10 states
export function getTopStates(data) {
  const map = {}
  data.forEach(row => {
    if (row.is_intl) return
    const s = row.buyer_state || 'Unknown'
    if (!map[s]) map[s] = { state: s, revenue: 0, orders: 0 }
    map[s].revenue += row.price || 0
    map[s].orders += 1
  })
  return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
}

// Aggregate: all states for map
export function getAllStates(data) {
  const map = {}
  data.forEach(row => {
    if (row.is_intl) return
    const s = row.buyer_state || 'Unknown'
    if (!map[s]) map[s] = { state: s, revenue: 0, orders: 0 }
    map[s].revenue += row.price || 0
    map[s].orders += 1
  })
  return map
}

// Aggregate: auth passed vs not - avg price
export function getAuthComparison(data) {
  const passed = data.filter(r => r.auth_passed === true)
  const notPassed = data.filter(r => r.auth_passed === false || r.auth_passed === null)
  const avg = arr => arr.length ? arr.reduce((s, r) => s + (r.price || 0), 0) / arr.length : 0
  return [
    { label: 'Auth Passed', avgPrice: avg(passed), count: passed.length },
    { label: 'Not Verified', avgPrice: avg(notPassed), count: notPassed.length },
  ]
}

// Aggregate: domestic vs international
export function getIntlVsDomestic(data) {
  const domestic = data.filter(r => !r.is_intl)
  const intl = data.filter(r => r.is_intl)
  return [
    { label: 'Domestic', revenue: domestic.reduce((s, r) => s + (r.price || 0), 0), orders: domestic.length },
    { label: 'International', revenue: intl.reduce((s, r) => s + (r.price || 0), 0), orders: intl.length },
  ]
}

// Aggregate: processing days distribution (bucket)
export function getProcessingDist(data) {
  const buckets = { '0 days': 0, '1 day': 0, '2 days': 0, '3 days': 0, '4+ days': 0 }
  data.forEach(r => {
    const d = r.processing_days
    if (d === null || d === undefined) return
    if (d === 0) buckets['0 days']++
    else if (d === 1) buckets['1 day']++
    else if (d === 2) buckets['2 days']++
    else if (d === 3) buckets['3 days']++
    else buckets['4+ days']++
  })
  return Object.entries(buckets).map(([label, count]) => ({ label, count }))
}

// Aggregate: monthly revenue by brand (stacked)
export function getMonthlyByBrand(data) {
  const months = {}
  const brands = new Set()
  data.forEach(row => {
    const m = row.month_num?.slice(0, 7)
    const b = row.brand || 'Other'
    if (!m) return
    brands.add(b)
    if (!months[m]) months[m] = { month: m }
    months[m][b] = (months[m][b] || 0) + (row.price || 0)
  })
  return {
    data: Object.values(months).sort((a, b) => a.month.localeCompare(b.month)),
    brands: [...brands]
  }
}

// Aggregate: buyer segmentation
export function getBuyerSegments(data) {
  const map = {}
  data.forEach(row => {
    const u = row.buyer_username
    if (!u) return
    if (!map[u]) map[u] = { orders: 0, spend: 0 }
    map[u].orders += 1
    map[u].spend += row.price || 0
  })
  let oneTime = 0, occasional = 0, vip = 0
  let oneTimeRev = 0, occasionalRev = 0, vipRev = 0
  Object.values(map).forEach(b => {
    if (b.orders === 1) { oneTime++; oneTimeRev += b.spend }
    else if (b.orders <= 3) { occasional++; occasionalRev += b.spend }
    else { vip++; vipRev += b.spend }
  })
  return [
    { segment: 'One-Time', buyers: oneTime, revenue: oneTimeRev },
    { segment: 'Occasional', buyers: occasional, revenue: occasionalRev },
    { segment: 'VIP (3+)', buyers: vip, revenue: vipRev },
  ]
}

// KPI summary
export function getKPIs(data) {
  const totalRevenue = data.reduce((s, r) => s + (r.price || 0), 0)
  const totalOrders = data.length
  const aov = totalRevenue / totalOrders
  const authPassed = data.filter(r => r.auth_passed).length
  const authRate = (authPassed / totalOrders) * 100
  const intlOrders = data.filter(r => r.is_intl).length
  const intlRate = (intlOrders / totalOrders) * 100

  const buyerMap = {}
  data.forEach(r => {
    if (!r.buyer_username) return
    buyerMap[r.buyer_username] = (buyerMap[r.buyer_username] || 0) + 1
  })
  const repeatBuyers = Object.values(buyerMap).filter(v => v > 1).length
  const totalBuyers = Object.keys(buyerMap).length
  const repeatRate = (repeatBuyers / totalBuyers) * 100

  return { totalRevenue, totalOrders, aov, authRate, intlRate, repeatRate, totalBuyers }
}
