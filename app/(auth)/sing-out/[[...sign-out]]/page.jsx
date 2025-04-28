import { useClerk } from "@clerk/nextjs";
import React from "react";

const page = () => {
  const { signOut } = useClerk();

  return (
    <div>
      <button onClick={() => signOut()} className="btn">
        Sign Out
      </button>
    </div>
  );
};

export default page;
