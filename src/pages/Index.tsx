import { Dashboard } from "@/pages/Dashboard";
import { UserRole } from "@/types/inventory";

interface IndexProps {
  currentUser: {
    name: string;
    role: UserRole;
  };
}

const Index = ({ currentUser }: IndexProps) => {

  return <Dashboard currentUser={currentUser} />;
};

export default Index;
