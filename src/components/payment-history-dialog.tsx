
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { User } from "@/hooks/use-auth";
import { PlusCircle } from "lucide-react";
import { firestore } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { FootballSpinner } from "./ui/football-spinner";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";

interface Payment {
  id: string;
  userId: string;
  amount: number;
  paymentDate: {
    seconds: number;
    nanoseconds: number;
  } | null; // Can be null temporarily
  type: 'Mensal' | 'Avulso';
}

interface PaymentHistoryDialogProps {
  player: User;
  groupId: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function PaymentHistoryDialog({ player, groupId, isOpen, setIsOpen }: PaymentHistoryDialogProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [paymentType, setPaymentType] = useState<'Mensal' | 'Avulso'>('Mensal');
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    
    setIsLoading(true);
    const collectionPath = `groups/${groupId}/payments`;
    const paymentsQuery = query(
      collection(firestore, collectionPath),
      where("userId", "==", player.uid),
      orderBy("paymentDate", "desc")
    );

    const unsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
      const paymentsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Payment[];
      setPayments(paymentsData);
      setIsLoading(false);
    }, (error: any) => {
       if (error.code === 'permission-denied') {
        console.error(
            "--- ERRO DE PERMISSÃO DO FIRESTORE ---",
            "\nCaminho da coleção:", collectionPath,
            "\nConsulta:", `onde 'userId' == '${player.uid}'`,
            "\nDetalhes do Erro:", error.message,
            "\nVerifique suas regras em 'firestore.rules' para garantir que o usuário autenticado tenha permissão de 'read' (list) neste caminho."
        );
      } else {
        console.error("Erro ao buscar pagamentos:", error);
      }
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os pagamentos. Verifique o console para mais detalhes." });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, groupId, player.uid, toast, player.displayName]);
  
  const handleAddPayment = async () => {
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast({ variant: "destructive", title: "Valor Inválido", description: "Por favor, insira um valor numérico positivo." });
      return;
    }

    setIsAddingPayment(true);
    const collectionPath = `groups/${groupId}/payments`;
    try {
      await addDoc(collection(firestore, collectionPath), {
        userId: player.uid,
        amount: paymentAmount,
        type: paymentType,
        paymentDate: serverTimestamp(),
      });
      toast({ variant: "success", title: "Pagamento Registrado!", description: "O novo pagamento foi adicionado com sucesso." });
      setAmount(""); // Reset form
      setPaymentType("Mensal");
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.error(
            "--- ERRO DE PERMISSÃO DO FIRESTORE ---",
            "\nCaminho da coleção:", collectionPath,
            "\nAção:", "create",
            "\nDetalhes do Erro:", error.message,
            "\nVerifique suas regras em 'firestore.rules' para garantir que o usuário autenticado tenha permissão de 'create' neste caminho."
        );
      } else {
        console.error("Erro ao adicionar pagamento:", error);
      }
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível registrar o pagamento. Verifique o console para mais detalhes." });
    } finally {
      setIsAddingPayment(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Histórico Financeiro</DialogTitle>
          <DialogDescription>
            Veja e adicione pagamentos para {player.displayName}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
            <h4 className="font-semibold">Registrar Novo Pagamento</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                    <Label htmlFor="amount">Valor (R$)</Label>
                    <Input id="amount" type="number" placeholder="Ex: 100.00" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isAddingPayment}/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="paymentType">Tipo</Label>
                    <Select value={paymentType} onValueChange={(v) => setPaymentType(v as 'Mensal' | 'Avulso')} disabled={isAddingPayment}>
                        <SelectTrigger id="paymentType">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Mensal">Mensal</SelectItem>
                            <SelectItem value="Avulso">Avulso</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <Button onClick={handleAddPayment} disabled={isAddingPayment || !amount}>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    {isAddingPayment ? "Salvando..." : "Salvar"}
                 </Button>
            </div>
        </div>

        <div className="space-y-2">
           <h4 className="font-semibold">Pagamentos Realizados</h4>
            <div className="max-h-[30vh] overflow-y-auto border rounded-md">
            {isLoading ? (
                <div className="flex justify-center items-center p-8">
                    <FootballSpinner />
                </div>
            ) : payments.length > 0 ? (
                <ul className="divide-y">
                {payments.map(payment => (
                    <li key={payment.id} className="flex items-center justify-between p-3">
                        <div>
                            <p className="font-medium">
                                {payment.paymentDate ? new Date(payment.paymentDate.seconds * 1000).toLocaleDateString('pt-BR', {
                                    day: '2-digit', month: '2-digit', year: 'numeric'
                                }) : 'Processando...'}
                            </p>
                             <Badge variant={payment.type === 'Mensal' ? "default" : "secondary"}>{payment.type}</Badge>
                        </div>
                        <span className="font-bold text-lg text-primary">
                            R$ {payment.amount.toFixed(2)}
                        </span>
                    </li>
                ))}
                </ul>
            ) : (
                <p className="text-center text-muted-foreground p-8">Nenhum pagamento registrado.</p>
            )}
            </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
