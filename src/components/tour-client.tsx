"use client";

import dynamic from "next/dynamic";

/** The tutorial measures the live DOM and reads tab storage, so it renders in the browser only. */
export const TourClient = dynamic(() => import("./tour").then((m) => m.Tour), { ssr: false });
