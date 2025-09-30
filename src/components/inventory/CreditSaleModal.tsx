import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface CreditSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (creditDetails: {
    customerName: string;
    customerPhone: string;
    paidAmount: number;
    dueDate: string;
  }) => void;
}

export function CreditSaleModal({
  isOpen,
  onClose,
  total,
  onConfirm
}: CreditSaleModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    paidAmount: 0,
    dueDate: ""
  });

  const handleSubmit = () => {
    // Validate form data
    if (!formData.customerName.trim()) {
      toast({
        title: "Customer name required",
        description: "Please enter the customer name",
        variant: "destructive"
      });
      return;
    }

    if (!formData.customerPhone.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter the customer phone number",
        variant: "destructive"
      });
      return;
    }

    if (!formData.dueDate) {
      toast({
        title: "Due date required",
        description: "Please select a due date",
        variant: "destructive"
      });
      return;
    }

    if (formData.paidAmount < 0) {
      toast({
        title: "Invalid amount",
        description: "Paid amount cannot be negative",
        variant: "destructive"
      });
      return;
    }

    if (formData.paidAmount > total) {
      toast({
        title: "Invalid amount",
        description: "Paid amount cannot be greater than total amount",
        variant: "destructive"
      });
      return;
    }

    onConfirm(formData);
    setFormData({
      customerName: "",
      customerPhone: "",
      paidAmount: 0,
      dueDate: ""
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Credit Sale Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              placeholder="Enter customer name"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone">Phone Number</Label>
            <Input
              id="customerPhone"
              placeholder="Enter phone number"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidAmount">Initial Payment</Label>
            <Input
              id="paidAmount"
              type="number"
              min="0"
              step="0.01"
              max={total}
              placeholder="Enter initial payment amount"
              value={formData.paidAmount}
              onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
            />
            <p className="text-sm text-muted-foreground">
              Total Amount: ₦{total.toFixed(2)}<br />
              Remaining: ₦{(total - formData.paidAmount).toFixed(2)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Confirm Credit Sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}