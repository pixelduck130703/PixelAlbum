import { useEffect, useRef, useState } from "react";

function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}) {
  const elementRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const hiddenDirection = {
    up: "translate-y-12",
    down: "-translate-y-12",
    left: "-translate-x-12",
    right: "translate-x-12",
    scale: "scale-95",
  };

  return (
    <div
      ref={elementRef}
      style={{
        transitionDelay: `${delay}ms`,
      }}
      className={`transition-all duration-700 ease-out ${
        visible
          ? "translate-x-0 translate-y-0 scale-100 opacity-100"
          : `${hiddenDirection[direction] || hiddenDirection.up} opacity-0`
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default ScrollReveal;