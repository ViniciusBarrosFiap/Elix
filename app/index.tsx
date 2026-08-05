import { useUserDataStore } from "@/src/store/userDataStore";
import { Redirect } from "expo-router";
import { useState } from "react";

export default function Index() {
  const isFirstAccess =
  useUserDataStore(
    (state) =>
      state.data?.primeiroAcesso
  );

  if(isFirstAccess === undefined) {
    return null;
  }

  if(isFirstAccess) {
    return (
      <Redirect href="/welcome" />
    );
  }
  
  return (
    <Redirect href="/home"/>
  );
}