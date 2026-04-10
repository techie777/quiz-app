"use client";

import { useEffect, useRef } from "react";
import Matter from "matter-js";
import { RefreshCcw } from "lucide-react";
import styles from "@/styles/FunFacts.module.css";

export default function AntiGravity({ onReset }) {
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);

  useEffect(() => {
    const elementsToFall = Array.from(document.querySelectorAll(".matter-element"));
    if (elementsToFall.length === 0) return;

    const engine = Matter.Engine.create();
    const world = engine.world;
    engineRef.current = engine;

    engine.world.gravity.y = 1;

    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "9998";
    document.body.appendChild(canvas);

    const render = Matter.Render.create({
      canvas,
      engine: engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        background: "transparent",
        wireframes: false,
      },
    });
    renderRef.current = render;

    const bodiesMap = new Map();
    const bodies = [];

    elementsToFall.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const isCircle = getComputedStyle(el).borderRadius === "50%";
      
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      let body;
      if (isCircle) {
        body = Matter.Bodies.circle(cx, cy, rect.width / 2, {
          restitution: 0.9,
          frictionAir: 0.05,
          friction: 0.1,
          render: { visible: false }
        });
      } else {
        body = Matter.Bodies.rectangle(cx, cy, rect.width, rect.height, {
          restitution: 0.6,
          frictionAir: 0.05,
          friction: 0.1,
          render: { visible: false }
        });
      }
      
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1);
      bodies.push(body);
      bodiesMap.set(body, el);

      el.style.position = "fixed";
      el.style.top = "0";
      el.style.left = "0";
      el.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
      el.style.zIndex = "9999";
    });

    Matter.World.add(world, bodies);

    const w = window.innerWidth;
    const h = window.innerHeight;
    const wallOptions = { isStatic: true, render: { visible: false } };
    
    Matter.World.add(world, [
      Matter.Bodies.rectangle(w / 2, -50, w, 100, wallOptions),
      Matter.Bodies.rectangle(w / 2, h + 50, w, 100, wallOptions),
      Matter.Bodies.rectangle(-50, h / 2, 100, h, wallOptions),
      Matter.Bodies.rectangle(w + 50, h / 2, 100, h, wallOptions)
    ]);

    const mouse = Matter.Mouse.create(document.body);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });
    Matter.World.add(world, mouseConstraint);
    
    canvas.style.pointerEvents = "auto";

    Matter.Events.on(engine, "afterUpdate", () => {
      bodiesMap.forEach((el, body) => {
        const ox = el.offsetWidth / 2;
        const oy = el.offsetHeight / 2;
        const tx = body.position.x - ox;
        const ty = body.position.y - oy;
        const rot = body.angle;

        el.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot}rad)`;
      });
    });

    Matter.Render.run(render);
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
      if (document.body.contains(canvas)) document.body.removeChild(canvas);
      
      if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
      if (renderRef.current) Matter.Render.stop(renderRef.current);
      if (engineRef.current) Matter.World.clear(engineRef.current.world, false);
      if (engineRef.current) Matter.Engine.clear(engineRef.current);

      elementsToFall.forEach((el) => {
        el.style.position = "";
        el.style.top = "";
        el.style.left = "";
        el.style.transform = "";
        el.style.zIndex = "";
      });
    };
  }, []);

  return (
    <div className={styles.antiGravityOverlay}>
      <button 
        onClick={onReset}
        className={styles.resetButton}
      >
        <RefreshCcw size={16} /> Reset Gravity
      </button>
    </div>
  );
}
