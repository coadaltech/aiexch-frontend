import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Shield, Star, TrendingUp } from "lucide-react";
import { winners, paymentMethods } from "@/data";

// Live Winners Section
export function LiveWinners() {
  return (
    <div className="py-6">
      <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
        Recent Winners
      </h2>
      <Card className="p-4">
        {winners.map((winner, i) => (
          <div
            key={i}
            className="flex justify-between items-center py-3 border-b border-primary/20 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Trophy className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <span className="text-foreground font-medium">
                  {winner.name}
                </span>
                <p className="text-muted-foreground text-sm">{winner.game}</p>
              </div>
            </div>
            <span className="text-primary font-bold">{winner.amount}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// Tournament Section
export function Tournaments() {
  return (
    <section className="py-6">
      <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4 flex items-center gap-2">
        <Trophy className="w-6 h-6" /> Tournaments
      </h2>
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-foreground font-bold">
              Weekly Slots Championship
            </h3>
            <p className="text-muted-foreground">Prize Pool: $50,000</p>
          </div>
          <Badge className="bg-primary text-primary-foreground">Live</Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Ends in: 2d 14h 32m</p>
          <p>Players: 1,247</p>
        </div>
      </Card>
    </section>
  );
}

// Stats Section
export function CasinoStats() {
  const stats = [
    { icon: Users, label: "Active Players", value: "25,000+" },
    { icon: TrendingUp, label: "Total Payouts", value: "$2.5M" },
    { icon: Shield, label: "Games Available", value: "500+" },
    { icon: Star, label: "Average Rating", value: "4.8/5" },
  ];

  return (
    <section className="py-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="p-4 text-center">
            <stat.icon className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">
              {stat.value}
            </div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </Card>
        ))}
      </div>
    </section>
  );
}

// Payment Methods Section
export function PaymentMethods() {
  return (
    <section className="py-6">
      <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
        Payment Methods
      </h2>
      <Card className="p-6 text-center">
        <div className="flex flex-wrap justify-center gap-3 mb-4">
          {paymentMethods.map((method, i) => (
            <span
              key={i}
              className="bg-primary/20 text-foreground px-3 py-1 rounded-full text-sm font-medium"
            >
              {method}
            </span>
          ))}
        </div>
        <p className="text-muted-foreground text-sm">
          Fast & secure deposits and withdrawals
        </p>
      </Card>
    </section>
  );
}
