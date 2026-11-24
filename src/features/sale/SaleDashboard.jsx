import SalesDashboard from '../sales/SalesDashboard';

// Sale và Marketing dùng CHUNG layout + tương tác.
// SalesDashboard(team='sale') sử dụng API/targets Sale độc lập ở saleMarketingAdapter.
export default function SaleDashboard() {
  return <SalesDashboard team="sale" />;
}
