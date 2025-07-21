import React from "react";
import { BuilderComponent, builder } from "@builder.io/react";
import { useParams } from "react-router-dom";


builder.init("ad297aa056904213a91bf034beeb7228");

export default function BuilderPage() {
  const params = useParams();
  // Get the wildcard path after /builder/
  const pagePath = params["*"];
  // Builder expects the path to start with a slash
  //const urlPath = pagePath ? `/${pagePath}` : "/";
  const urlPath = pagePath ? `/builder/${pagePath}` : "/";


  return (
    <div style={{ minHeight: "80vh", marginTop: "120vh" }}>
      <BuilderComponent model="page" options={{ url: urlPath }} />
    </div>

  );
}