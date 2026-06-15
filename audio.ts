@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
}

html {
  scroll-behavior: smooth;
}

/* Highlighter underline used to mark detected questions in the transcript. */
.mark-question {
  background-image: linear-gradient(transparent 60%, rgba(225, 29, 72, 0.18) 0);
}

::selection {
  background: rgba(217, 119, 6, 0.22);
}

/* Thin, calm scrollbars for the transcript column. */
.scroll-quiet::-webkit-scrollbar {
  width: 10px;
}
.scroll-quiet::-webkit-scrollbar-thumb {
  background: #ded9cf;
  border-radius: 999px;
  border: 3px solid #fbfaf8;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
