"use client";

import "react-multi-carousel/lib/styles.css";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import dynamic from "next/dynamic";

const Carousel = dynamic(() => import("react-multi-carousel"), { ssr: false });

const games = [
  {
    id: 1,
    title: "TABULEIRO ROMÂNTICO",
    imageUrl: "/images/tabuleiro.png",
    description:
      "Explore desafios e momentos românticos em um jogo de tabuleiro feito para casais.",
  },
  {
    id: 2,
    title: "CARTAS",
    imageUrl: "/images/cartas.png",
    description:
      "Responda perguntas, encare desafios e descubra mais sobre seu parceiro.",
  },
  {
    id: 3,
    title: "EM BREVE...",
    imageUrl: "/images/building.png",
    description:
      "Um novo jogo vem aí... repleto de missões amorosas e diversão para dois!",
  },
];

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-romantic-gradient">
      <Header />

      <main className="flex flex-1 px-10 py-10 items-center">
        <section className="relative w-3/5 flex flex-col justify-center items-center">
          <Carousel
            partialVisible
            responsive={{
              desktop: {
                breakpoint: { max: 3000, min: 1024 },
                items: 2,
                partialVisibilityGutter: 80,
              },
              tablet: {
                breakpoint: { max: 1024, min: 640 },
                items: 1,
                partialVisibilityGutter: 50,
              },
              mobile: {
                breakpoint: { max: 640, min: 0 },
                items: 1,
                partialVisibilityGutter: 35,
              },
            }}
            infinite
            draggable
            swipeable
            keyBoardControl
            customTransition="transform 700ms ease-in-out"
            transitionDuration={700}
            arrows
            renderButtonGroupOutside={false}
            containerClass="w-full"
            itemClass="px-3"
          >
            {games.map((game) => (
              <div key={game.id} className="carrousel-card">
                <div className="mx-auto mb-4 flex justify-center">
                  <Image
                    src={game.imageUrl}
                    alt={game.title}
                    width={200}
                    height={200}
                    className="object-contain drop-shadow-md rounded-xl"
                    priority
                  />
                </div>

                <h3 className="carrousel-card-title text-center mb-2">
                  {game.title}
                </h3>

                <p className="carrousel-card-description text-center">
                  {game.description}
                </p>
              </div>
            ))}
          </Carousel>
        </section>

        <section className="w-2/5 flex flex-col items-center justify-center gap-12 pl-12">
          <button
            onClick={() => router.push("/CreateRoom")}
            className="btn-lg btn-primary-gradient soft-shadow btn-page"
          >
            ➕ Criar Sala
          </button>

          <button
            onClick={() => router.push("/JoinRoom")}
            className="btn-lg btn-secondary-gradient soft-shadow btn-page"
          >
            🔑 Entrar em Sala
          </button>
        </section>
      </main>

      <Footer />
    </div>
  );
}
