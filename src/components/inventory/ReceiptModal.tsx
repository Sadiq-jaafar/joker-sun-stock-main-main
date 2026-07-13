import { Sale } from "@/types/inventory";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Receipt, Download, Printer } from "lucide-react";
import jsPDF from "jspdf";

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
    const doc = new jsPDF();
    let yPosition = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const maxWidth = pageWidth - 2 * margin;

    // Header
    doc.setFontSize(14);
    doc.text("JOKER SOLAR SOLUTION", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 6;
    doc.setFontSize(10);
    doc.text("Electronics Store", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 4;
    doc.text("Solar Energy Equipment", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 8;

    // Separator
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;

    // Receipt Details
    doc.setFontSize(10);
    doc.text(`Receipt #: ${sale.receiptNumber}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Date: ${new Date(sale.soldAt).toLocaleString()}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Customer: ${sale.customerName}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Sold by: ${sale.soldBy}`, margin, yPosition);
    yPosition += 8;

    // Separator
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;

    // Items Header
    doc.setFont(undefined, "bold");
    doc.text("ITEMS", margin, yPosition);
    yPosition += 6;
    doc.setFont(undefined, "normal");

    // Items
    sale.items.forEach((cartItem) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 15;
      }
      doc.setFontSize(9);
      doc.text(`${cartItem.item.name}`, margin, yPosition);
      yPosition += 4;
      doc.text(`${cartItem.item.brand} ${cartItem.item.model}`, margin + 2, yPosition);
      yPosition += 4;
      const itemTotal = cartItem.selectedPrice * cartItem.quantity;
      doc.text(
        `${cartItem.quantity} x ₦${cartItem.selectedPrice.toFixed(2)} = ₦${itemTotal.toFixed(2)}`,
        margin + 2,
        yPosition
      );
      yPosition += 6;
    });

    yPosition += 2;

    // Separator
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;

    // Total
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Total:", margin, yPosition);
    doc.text(`₦${sale.total.toFixed(2)}`, pageWidth - margin, yPosition, { align: "right" });
    yPosition += 8;

    // Separator
    doc.setFont(undefined, "normal");
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;

    // Footer
    doc.setFontSize(9);
    doc.text("Thank you for your business!", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 4;
    doc.text("Visit us at jokersolar.com", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 4;
    doc.text("All sales are final", pageWidth / 2, yPosition, { align: "center" });

    doc.save(`receipt-${sale.receiptNumber}.pdf`);
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
                  <span className="text-sm">₦{(cartItem.selectedPrice * cartItem.quantity).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{cartItem.item.brand} {cartItem.item.model}</span>
                  <span>{cartItem.quantity} × ₦{cartItem.selectedPrice.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>₦{sale.total.toFixed(2)}</span>
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
    lines.push(`${cartItem.quantity} × ₦${cartItem.selectedPrice.toFixed(2)} = ₦${(cartItem.selectedPrice * cartItem.quantity).toFixed(2)}`);
    lines.push("");
  });

  lines.push("-------------------------------------");
  lines.push(`TOTAL: ₦${sale.total.toFixed(2)}`);
  lines.push("=====================================");
  lines.push("");
  lines.push("Thank you for your business!");
  lines.push("Visit us at jokersolar.com");
  lines.push("All sales are final");

  return lines.join("\n");
}