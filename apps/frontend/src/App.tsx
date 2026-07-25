import { useEffect } from "react";
import { getHealth } from "./services/health";
import MainLayout from "./layouts/MainLayout";

export default function App() {

  useEffect(() => {

    getHealth()

      .then(console.log)

      .catch(console.error);

  }, []);

  return (
    <>
      <MainLayout>
        <h1>AtlasAI</h1>
      </MainLayout>
    </>

  );

}