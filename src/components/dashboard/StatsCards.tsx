/**
 * StatsCards — shows 4 key metrics at the top of the dashboard
 */
import { Package, ShoppingCart, FileText, IndianRupee } from 'lucide-react';
import { useStore } from '@/lib/store';

export function StatsCards() {
  const { products, todaysBills, todaysSales } = useStore();

  const stats = [
    { label: 'Total Products', value: products.length, icon: Package, color: 'bg-primary' },
    { label: "Today's Sales", value: `₹${todaysSales.toFixed(0)}`, icon: IndianRupee, color: 'bg-accent' },
    { label: "Today's Bills", value: todaysBills.length, icon: FileText, color: 'bg-success' },
    { label: 'Total Bills', value: todaysBills.length > 0 ? `${todaysBills.length} bills` : 'No bills yet', icon: ShoppingCart, color: 'bg-invoice-accent' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="stat-card-hover bg-card rounded-xl border border-border p-4 flex items-center gap-4"
        >
          <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center shrink-0`}>
            <stat.icon className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
