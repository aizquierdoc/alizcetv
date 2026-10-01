import React from "react";

// Wrapper for any element that should be navigable by TV focus engine.
// Provide `id` (unique), `onSelect` callback, and children.
const Focusable = React.forwardRef(function Focusable(
  { id, onSelect, className = "", children, as: Comp = "button", testId, ...rest },
  ref
) {
  return (
    <Comp
      ref={ref}
      data-focusable="true"
      data-focus-id={id}
      data-focused="false"
      data-testid={testId || `focusable-${id}`}
      onClick={(e) => {
        onSelect && onSelect(e);
      }}
      onMouseEnter={(e) => {
        // Set this item as focused on mouse hover (nice for mouse testing too)
        document.querySelectorAll('[data-focused="true"]').forEach((n) => {
          if (n !== e.currentTarget) n.setAttribute("data-focused", "false");
        });
        e.currentTarget.setAttribute("data-focused", "true");
      }}
      className={`focusable ${className}`}
      {...rest}
    >
      {children}
    </Comp>
  );
});

export default Focusable;
