"use client";

import "react-multi-carousel/lib/styles.css";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import dynamic from "next/dynamic";
import { games } from "@/mocks/games";
import { useI18n } from "../../lib/i18n";

const Carousel = dynamic(() => import("react-multi-carousel"), { ssr: false });

export default function Home() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col bg-romantic-gradient">
      <Header />

      <main className="flex flex-1 px-10 py-10 items-center">
        <section className="relative w-3/5 flex flex-col justify-center items-center">
          <Carousel
            partialVisible
            responsive={{
              desktop: {
                breakpoint: { max: 3000, min: 1500 },
                items: 2,
                partialVisibilityGutter: 80,
              },
              tablet: {
                breakpoint: { max: 1500, min: 1200 },
                items: 1,
                partialVisibilityGutter: 280,
              },
              mobile: {
                breakpoint: { max: 1200, min: 900 },
                items: 1,
                partialVisibilityGutter: 200,
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
            className="btn-lg btn-primary-gradient soft-shadow btn-page [width:250px]"
          >
            ➕ {t("btnActions.createRoom")}
          </button>

          <button
            onClick={() => router.push("/JoinRoom")}
            className="btn-lg btn-secondary-gradient soft-shadow btn-page  [width:250px]"
          >
            🔑 {t("btnActions.joinRoom")}
          </button>
        </section>
      </main>

      <Footer />
    </div>
  );
}
