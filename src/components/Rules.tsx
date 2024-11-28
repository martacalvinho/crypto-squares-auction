import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface RulesProps {
  variant?: 'default' | 'header';
}

export const Rules = ({ variant = 'default' }: RulesProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          className={cn(
            "font-medium transition-all duration-300",
            variant === 'header'
              ? "border border-crypto-primary/20 bg-transparent text-crypto-primary hover:bg-crypto-primary/5"
              : "bg-white text-gray-900 hover:bg-gray-100"
          )}
          size={variant === 'header' ? 'sm' : 'default'}
          variant="ghost"
        >
          <Info className="w-4 h-4 mr-2" />
          Rules
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">How It Works</DialogTitle>
          <DialogDescription>
            Simple rules to participate in Crypto 500
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            <section>
              <h3 className="font-semibold text-lg mb-2 text-crypto-primary">Bidding</h3>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Start bidding at 0.005 SOL for any empty spot</li>
                <li>For spots under 1 SOL: minimum increase of 0.05 SOL</li>
                <li>For spots over 1 SOL: minimum increase of 10%</li>
                <li>All bids are final</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2 text-crypto-primary">Boost</h3>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Minimum contribution of 0.05 SOL for 1 hour of boost time</li>
                <li>Each 0.05 SOL adds 1 hour of featured time</li>
                <li>Maximum of 48 hours per slot</li>
                <li>Projects move up slots as others expire</li>
                <li>Projects can join waitlist and auto-fill empty slots</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2 text-crypto-primary">Your Spot</h3>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Showcase your crypto project after winning a bid</li>
                <li>Keep your spot until someone outbids you</li>
                <li>Update your project info anytime</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2 text-crypto-primary">Requirements</h3>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Projects must be crypto/blockchain related</li>
                <li>Information must be accurate</li>
                <li>Appropriate logos and safe links only</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2 text-crypto-primary">Payment</h3>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>All payments are in SOL</li>
                <li>Connect your Solana wallet to participate</li>
                <li>Payment is instant and automatic</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};