"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const LampContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "relative flex min-h-[50vh] flex-col items-center justify-center overflow-hidden bg-transparent w-full rounded-md z-0",
        className
      )}
    >
      <div className="relative flex w-full flex-1 items-center justify-center isolate z-0 ">
        <motion.div
          initial={{ opacity: 0.3, width: "15rem" }}
          whileInView={{ opacity: 0.8, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-gradient-from) 0deg, var(--conic-gradient-via) 0deg, var(--conic-gradient-to) 180deg, transparent 180deg)`,
          }}
          className="absolute inset-auto right-1/2 h-56 overflow-visible w-[30rem] bg-gradient-conic from-[#D4AF37]/40 via-transparent to-transparent text-white [--conic-gradient-from:rgba(212,175,55,0.3)] [--conic-gradient-via:transparent] [--conic-gradient-to:transparent]"
        >
          <div className="absolute  w-[100%] left-0 bg-transparent h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div className="absolute  w-40 h-[100%] left-0 bg-transparent  bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0.3, width: "15rem" }}
          whileInView={{ opacity: 0.8, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-gradient-from) 210deg, var(--conic-gradient-via) 360deg, var(--conic-gradient-to) 360deg, transparent 360deg)`,
          }}
          className="absolute inset-auto left-1/2 h-56 w-[30rem] bg-gradient-conic from-transparent via-transparent to-[#D4AF37]/40 text-white [--conic-gradient-from:transparent] [--conic-gradient-via:transparent] [--conic-gradient-to:rgba(212,175,55,0.3)]"
        >
          <div className="absolute  w-40 h-[100%] right-0 bg-transparent  bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" />
          <div className="absolute  w-[100%] right-0 bg-transparent h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
        </motion.div>
        <div className="absolute top-1/2 h-48 w-full translate-y-12 bg-transparent blur-2xl"></div>
        <div className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-5 backdrop-blur-md"></div>
        <div className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full bg-[#D4AF37]/20 opacity-40 blur-3xl"></div>
        <motion.div
          initial={{ width: "8rem" }}
          whileInView={{ width: "16rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-30 h-36 w-64 -translate-y-[6rem] rounded-full bg-[#D4AF37]/20 blur-2xl"
        ></motion.div>
        <motion.div
          initial={{ width: "15rem" }}
          whileInView={{ width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[7rem] bg-[#D4AF37]/40 "
        ></motion.div>

        <div className="absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem] bg-transparent"></div>
      </div>

      <div className="relative z-50 flex -translate-y-4 flex-col items-center px-5">
        {children}
      </div>
    </div>
  );
};
