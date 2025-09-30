import { useState } from "react";
import { CartItem } from "@/types/inventory";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditSaleModal } from "./CreditSaleModal";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
    onCheckout: (data: {
    customerName: string;
    isCredit: boolean;
    paidAmount?: number;
    customerPhone?: string;
    dueDate?: string;
  }) => void;
  currentUser: { name: string };
}

export function CartModal({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  currentUser
}: CartModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [paymentType, setPaymentType] = useState<"full" | "credit">("full");
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isCredit, setIsCredit] = useState(false);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [customerPhone, setCustomerPhone] = useState("");
  const [dueDate, setDueDate] = useState("");
  const { toast } = useToast();

  const total = cartItems.reduce((sum, cartItem) => sum + (cartItem.selectedPrice * cartItem.quantity), 0);

  const handleRegularCheckout = () => {
    if (!customerName.trim()) {
      toast({
        title: "Customer name required",
        description: "Please enter a customer name before checkout.",
        variant: "destructive"
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Empty cart",
        description: "Add items to cart before checkout.",
        variant: "destructive"
      });
      return;
    }

    if (isCredit) {
      if (!customerPhone.trim()) {
        toast({
          title: "Phone number required",
          description: "Please enter a customer phone number for credit sales.",
          variant: "destructive"
        });
        return;
      }
      if (!dueDate) {
        toast({
          title: "Due date required",
          description: "Please select a due date for credit sales.",
          variant: "destructive"
        });
        return;
      }
      if (paidAmount > total) {
        toast({
          title: "Invalid amount",
          description: "Paid amount cannot be greater than total amount.",
          variant: "destructive"
        });
        return;
      }
    }

    onCheckout({
      customerName,
      isCredit,
      paidAmount: isCredit ? paidAmount : total,
      customerPhone: isCredit ? customerPhone : undefined,
      dueDate: isCredit ? dueDate : undefined
    });
    setCustomerName("");
    setIsCredit(false);
    setPaidAmount(0);
    setCustomerPhone("");
    setDueDate("");
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart ({cartItems.length} items)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {cartItems.map((cartItem) => (
                  <div key={cartItem.item.id} className="flex gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{cartItem.item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {cartItem.item.brand} {cartItem.item.model}
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        {cartItem.item.category}
                      </Badge>
                      <p className="font-semibold mt-2">₦{cartItem.selectedPrice.toFixed(2)} each</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {cartItem.item.measureType === 'length' ? (
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={cartItem.quantity}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value) && value > 0) {
                              onUpdateQuantity(cartItem.item.id, value);
                            }
                          }}
                          className="w-24"
                        />
                      ) : (
                        <>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => onUpdateQuantity(cartItem.item.id, Math.max(1, cartItem.quantity - 1))}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-12 text-center font-medium">{cartItem.quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => onUpdateQuantity(cartItem.item.id, cartItem.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">₦{(cartItem.selectedPrice * cartItem.quantity).toFixed(2)}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemoveItem(cartItem.item.id)}
                        className="mt-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="text-right">
                  <p className="text-lg font-semibold">Total: ₦{total.toFixed(2)}</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      placeholder="Enter customer name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="fullPayment"
                      checked={!isCredit}
                      onChange={() => setIsCredit(false)}
                    />
                    <Label htmlFor="fullPayment">Full Payment</Label>

                    <input
                      type="radio"
                      id="creditPayment"
                      checked={isCredit}
                      onChange={() => setIsCredit(true)}
                      className="ml-4"
                    />
                    <Label htmlFor="creditPayment">Credit Payment</Label>
                  </div>

                  {isCredit && (
                    <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                      <div className="space-y-2">
                        <Label htmlFor="customerPhone">Customer Phone</Label>
                        <Input
                          id="customerPhone"
                          placeholder="Enter customer phone number"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
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
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(Number(e.target.value))}
                        />
                        <p className="text-sm text-muted-foreground">
                          Remaining: ₦{(total - paidAmount).toFixed(2)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={dueDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setDueDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Continue Shopping
                  </Button>
                  <Button onClick={handleRegularCheckout} className="flex-1">
                    Complete Sale
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>

    <CreditSaleModal
      isOpen={isCreditModalOpen}
      onClose={() => setIsCreditModalOpen(false)}
      total={total}
      onConfirm={(creditDetails) => {
        onCheckout({
          customerName: creditDetails.customerName,
          isCredit: true,
          paidAmount: creditDetails.paidAmount,
          customerPhone: creditDetails.customerPhone,
          dueDate: creditDetails.dueDate
        });
        setIsCreditModalOpen(false);
        setCustomerName("");
        setPaymentType("full");
      }}
    />
    </>
  );
}