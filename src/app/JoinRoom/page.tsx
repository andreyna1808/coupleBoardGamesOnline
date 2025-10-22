"use client";

import RoomForm from "@/components/RoomForm";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function JoinRoomPage() {
  return (
    <div className="min-h-screen flex flex-col bg-romantic-gradient">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <RoomForm mode="join" />
      </main>
      <Footer />
    </div>
  );
}
