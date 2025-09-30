import { Sale } from "@/types/inventory";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Receipt, Download, Printer } from "lucide-react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export function ReceiptModal({ isOpen, onClose, sale }: ReceiptModalProps) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const receiptContent = generateReceiptText(sale);
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${sale.receiptNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Sales Receipt
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 print:text-black">
          {/* Header */}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold">Joker Solar Solution</h2>
            <p className="text-sm text-muted-foreground">Electronics Store</p>
            <p className="text-sm text-muted-foreground">Solar Energy Equipment</p>
          </div>

          <Separator />

          {/* Receipt Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Receipt #:</span>
              <span className="font-mono">{sale.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{sale.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date(sale.soldAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Sold by:</span>
              <span>{sale.soldBy}</span>
            </div>
          </div>

          <Separator />

          {/* Items */}
          <div className="space-y-2">
            {sale.items.map((cartItem, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{cartItem.item.name}</span>
                  <span className="text-sm">${(cartItem.selectedPrice * cartItem.quantity).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{cartItem.item.brand} {cartItem.item.model}</span>
                  <span>{cartItem.quantity} × ${cartItem.selectedPrice.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>${sale.total.toFixed(2)}</span>
          </div>

          <Separator />

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>Thank you for your business!</p>
            <p>Visit us at jokersolar.com</p>
            <p>All sales are final</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" onClick={handlePrint} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          <Button onClick={onClose} className="w-full print:hidden">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function generateReceiptText(sale: Sale): string {
  const lines = [
    "=====================================",
    "        JOKER SOLAR SOLUTION",
    "         Electronics Store",
    "       Solar Energy Equipment",
    "=====================================",
    "",
    `Receipt #: ${sale.receiptNumber}`,
    `Date: ${new Date(sale.soldAt).toLocaleString()}`,
    `Customer: ${sale.customerName}`,
    `Sold by: ${sale.soldBy}`,
    "",
    "-------------------------------------",
    "ITEMS",
    "-------------------------------------",
  ];

  sale.items.forEach((cartItem) => {
    lines.push(`${cartItem.item.name}`);
    lines.push(`${cartItem.item.brand} ${cartItem.item.model}`);
    lines.push(`${cartItem.quantity} × $${cartItem.selectedPrice.toFixed(2)} = $${(cartItem.selectedPrice * cartItem.quantity).toFixed(2)}`);
    lines.push("");
  });

  lines.push("-------------------------------------");
  lines.push(`TOTAL: $${sale.total.toFixed(2)}`);
  lines.push("=====================================");
  lines.push("");
  lines.push("Thank you for your business!");
  lines.push("Visit us at jokersolar.com");
  lines.push("All sales are final");

  return lines.join("\n");
}