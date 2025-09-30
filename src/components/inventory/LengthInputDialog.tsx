import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LengthInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (length: number) => void;
  itemName: string;
  availableLength: number;
}

export function LengthInputDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  availableLength,
}: LengthInputDialogProps) {
  const [length, setLength] = useState("");

  const handleConfirm = () => {
    const value = parseFloat(length);
    if (!isNaN(value) && value > 0) {
      onConfirm(value);
      setLength("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enter Length for {itemName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="length" className="col-span-4">
              Available: {availableLength.toFixed(2)} meters
            </Label>
            <Input
              id="length"
              type="number"
              step="0.01"
              min="0.01"
              max={availableLength}
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="Enter length in meters"
              className="col-span-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirm();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}