import { useState, useEffect, useCallback, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import supabase from "./supabase";
import Login from "./Login";

// ─── Accent tokens ─────────────────────────────────────────────────────────────
const C_BLUE = "#60aebb";
const C_RED  = "#db3c1c";

// ─── Logo (SVG incrustado — sin imports externos) ─────────────────────────────
const LogoMark = ({ className = "h-6 w-auto" }) => (
  <svg className={className} viewBox="0 0 6000 3375" xmlns="http://www.w3.org/2000/svg"
    style={{ fillRule:"evenodd", clipRule:"evenodd", strokeLinecap:"round", strokeLinejoin:"round", strokeMiterlimit:"22.926" }}
  >
    <path d="M1577.067,1787.012c-41.243,48.193 -29.069,158.236 92.22,221.712c121.305,63.46 351.725,80.355 582.682,73.161c230.957,-7.178 462.419,-38.444 626.383,-135.352c163.981,-96.891 260.465,-259.424 230.111,-306.413c-30.339,-46.973 -187.533,21.598 -425.472,61.865c-237.939,40.251 -556.657,52.181 -763.33,51.318c-206.689,-0.846 -301.351,-14.486 -342.594,33.708" style={{fill:"#db3c1c"}}/>
    <path d="M3876.888,1411.263c-87.044,-27.832 -283.398,-79.297 -556.299,-56.999c-272.917,22.298 -622.428,118.359 -967.546,176.042c-345.117,57.682 -685.856,77.002 -787.549,113.737c-101.709,36.719 35.645,90.853 242.139,122.054c206.494,31.201 482.145,39.469 786.768,-5.99c304.59,-45.459 638.151,-144.629 863.818,-205.697c225.684,-61.051 343.506,-84.001 413.509,-97.575c70.003,-13.558 92.22,-17.757 5.16,-45.573" style={{fill:"#60aebb"}}/>
    <g>
      <clipPath id="lm1"><rect x="713.021" y="858.333" width="4574.479" height="1654.167"/></clipPath>
      <g clipPath="url(#lm1)">
        <path d="M4795.652,1205.209c-90.706,-21.338 -181.413,-42.676 -279.736,-54.167c-98.34,-11.475 -204.281,-13.102 -262.939,-5.778c-58.691,7.324 -70.117,23.617 -39.469,44.01c30.68,20.378 103.402,44.857 130.29,50.553c26.888,5.713 7.975,-7.373 -137.614,-61.963c-145.54,-54.59 -417.757,-150.683 -619.856,-213.395c-202.1,-62.712 -334.131,-92.041 -519.108,-96.11c-184.993,-4.069 -422.965,17.106 -617.741,61.084c-194.775,43.978 -346.354,110.758 -477.555,191.39c-131.217,80.631 -242.041,175.098 -227.376,164.518c14.665,-10.596 154.834,-126.237 337.386,-182.438c182.552,-56.201 407.471,-52.93 594.922,-18.734c187.435,34.212 337.386,99.365 445.768,137.646c108.398,38.281 175.212,49.674 274.642,58.643c99.43,8.952 231.445,15.462 350.407,34.196c119.01,18.734 224.951,49.691 251.025,47.233c26.074,-2.425 -27.702,-38.265 -184.163,-65.967c-156.494,-27.686 -415.641,-47.233 -726.123,-32.568c-310.498,14.665 -672.347,63.525 -916.015,92.838c-243.669,29.329 -369.173,39.095 -469.417,39.095c-100.228,0 -175.212,-9.766 -205.355,-31.755c-30.159,-21.989 -15.495,-56.201 25.26,-79.818c40.739,-23.617 107.568,-36.654 135.27,-27.686c27.718,8.952 16.309,39.893 0,66.781c-16.292,26.872 -37.484,49.674 -61.93,52.116c-24.447,2.441 -52.165,-15.462 -57.047,-35.84c-4.883,-20.361 13.037,-43.164 39.111,-60.254c26.09,-17.106 60.319,-28.516 52.978,-11.409c-7.34,17.106 -56.234,62.712 -132.845,91.211c-76.595,28.516 -180.908,39.909 -268.929,48.063c-88.005,8.138 -159.733,13.021 -193.148,26.058c-33.398,13.037 -28.516,34.212 -13.851,41.536c14.681,7.324 39.128,0.814 59.505,-12.223c20.361,-13.037 36.67,-32.568 15.479,-34.196c-21.191,-1.628 -79.866,14.648 -126.318,36.654c-46.452,21.973 -80.68,49.674 -108.398,118.896c-27.702,69.222 -48.893,179.997 -66.829,257.373c-17.92,77.36 -32.585,121.338 -31.771,147.396c0.814,26.074 17.106,34.212 12.223,48.063c-4.883,13.835 -30.973,33.382 -46.452,35.01c-15.479,1.628 -20.378,-14.648 8.968,-11.393c29.329,3.255 92.904,26.058 136.084,38.281c43.197,12.207 66.016,13.835 70.898,-6.51c4.899,-20.361 -8.138,-62.728 -27.702,-82.259c-19.548,-19.548 -45.638,-16.309 -69.255,-16.309c-23.633,0 -44.824,-3.239 -43.197,-21.973c1.628,-18.734 26.074,-52.946 52.962,-60.27c26.888,-7.324 56.234,12.207 52.148,14.648c-4.069,2.458 -41.553,-12.207 -57.845,-47.233c-16.309,-35.026 -11.409,-90.397 6.51,-136.816c17.936,-46.419 48.909,-83.887 65.202,-93.669c16.292,-9.766 17.936,8.154 10.596,43.978c-7.34,35.84 -23.633,89.6 -32.601,130.322c-8.968,40.706 -10.596,68.408 -6.527,35.01c4.069,-33.382 13.867,-127.864 41.569,-195.459c27.702,-67.594 73.34,-108.333 132.015,-126.237c58.691,-17.92 130.404,-13.037 193.978,22.803c63.558,35.84 118.978,102.62 145.866,192.204c26.888,89.583 25.26,201.986 16.292,281.803c-8.952,79.801 -25.26,127.034 -68.441,161.247c-43.197,34.212 -113.281,55.387 -175.228,49.691c-61.93,-5.697 -115.723,-38.281 -156.478,-107.519c-40.739,-69.222 -68.441,-175.098 -68.441,-268.75c0,-93.669 27.702,-175.114 64.372,-223.161c36.686,-48.047 82.324,-62.712 110.026,-68.408c27.702,-5.697 37.484,-2.458 30.143,11.393c-7.324,13.851 -31.787,38.281 -30.143,81.445c1.628,43.164 29.329,105.062 34.228,102.62c4.883,-2.441 -13.037,-69.222 -4.085,-104.248c8.968,-35.01 44.824,-38.281 82.324,-5.697c37.484,32.585 76.595,100.993 92.887,180.81c16.309,79.801 9.798,171.029 -25.244,231.299c-35.042,60.27 -98.616,89.583 -154.036,76.546c-55.42,-13.021 -102.685,-68.408 -126.318,-144.971c-23.633,-76.546 -23.633,-174.284 -8.968,-239.437c14.681,-65.153 44.01,-97.738 98.616,-118.913c54.59,-21.175 134.456,-30.941 205.371,-19.548c70.898,11.409 132.829,43.978 197.2,98.551c64.388,54.574 131.217,131.12 227.392,180.81c32.79,16.939 68.991,30.753 108.118,41.669c75.616,21.095 162.164,31.363 256.155,32.436c142.611,1.628 302.344,-17.92 457.194,-54.574c154.834,-36.637 304.785,-90.397 411.54,-139.258c106.771,-48.861 170.329,-92.838 143.441,-124.609c-26.904,-31.771 -144.238,-51.318 -371.631,-69.238c-227.36,-17.904 -564.746,-34.196 -814.941,-30.941c-250.195,3.255 -413.183,26.058 -482.454,51.318c-69.271,25.244 -44.824,52.93 -26.888,111.572c17.92,58.626 29.329,148.226 26.074,227.23c-3.255,78.988 -21.191,147.412 -15.479,184.879c5.697,37.451 35.042,43.978 103.499,48.861c68.441,4.883 176.009,8.138 192.318,-13.851c16.309,-21.989 -58.675,-69.222 -120.605,-96.094c-61.93,-26.888 -110.824,-33.398 -111.654,-13.037c-0.814,20.361 46.452,67.594 117.35,92.025c70.898,24.43 165.446,26.074 275.456,30.143c110.026,4.069 235.53,10.596 352.864,23.617c117.366,13.021 226.579,32.568 335.775,47.233c109.196,14.665 218.408,24.447 248.551,12.223c30.159,-12.223 -18.734,-46.436 -98.6,-84.7c-79.866,-38.281 -190.706,-80.631 -244.482,-85.531c-53.792,-4.883 -50.537,27.702 -24.447,62.728c26.074,35.026 74.967,72.477 163.802,93.652c88.835,21.175 217.578,26.074 303.971,33.398c86.393,7.324 130.404,17.106 133.659,-10.596c3.255,-27.686 -34.228,-92.838 -39.941,-175.098c-5.713,-82.259 20.378,-181.624 -16.292,-206.868c-36.67,-25.244 -136.1,23.617 -326.806,72.493c-190.69,48.861 -472.656,97.721 -661.735,122.982c-189.062,25.244 -285.237,26.855 -249.381,24.43c35.872,-2.458 203.743,-8.968 391.178,-8.968c187.451,0 394.433,6.51 546.842,30.127c152.393,23.617 250.179,64.355 318.636,111.588c68.457,47.233 107.585,100.993 145.882,145.784c38.314,44.792 75.781,80.631 145.882,98.551c70.085,17.92 172.77,17.92 246.907,-44.792c74.186,-62.728 119.824,-188.151 127.148,-304.606c7.357,-116.471 -23.633,-223.974 -76.595,-299.707c-52.978,-75.749 -127.962,-119.726 -208.642,-137.646c-80.68,-17.92 -167.057,-9.766 -229.818,43.978c-62.744,53.76 -101.855,153.109 -110.824,248.405c-8.968,95.28 12.223,186.507 22.819,214.193c10.596,27.702 10.596,-8.138 21.191,-26.058c10.596,-17.92 31.771,-17.92 42.367,-68.424c10.596,-50.488 10.596,-151.465 50.537,-216.634c39.925,-65.153 119.792,-94.466 198.031,-71.663c78.239,22.803 154.834,97.721 180.094,191.39c25.26,93.669 -0.814,206.055 -33.382,279.362c-32.617,73.291 -71.745,107.487 -129.606,110.758c-57.845,3.255 -134.456,-24.43 -184.18,-70.052c-49.707,-45.605 -72.526,-109.131 -76.595,-177.539c-4.069,-68.408 10.596,-141.715 38.298,-155.566c27.702,-13.851 68.457,31.771 118.164,61.898c49.723,30.143 108.382,44.792 127.946,38.281c19.564,-6.51 0.016,-34.212 -9.782,-9.782c-9.782,24.447 -9.782,101.009 6.527,172.672c16.309,71.68 48.909,138.46 74.984,175.911c26.058,37.467 45.638,45.622 88.005,45.622c42.383,0 107.585,-8.154 158.089,-41.536c50.553,-33.398 86.393,-92.041 88.835,-114.03c2.474,-21.989 -28.516,-7.324 -49.707,-12.207c-21.175,-4.899 -32.585,-29.329 -41.553,-111.588c-8.968,-82.259 -15.511,-222.331 -60.303,-320.882c-44.84,-98.551 -127.946,-155.566 -114.095,-173.47c13.851,-17.92 124.674,3.239 192.318,79.801c67.643,76.562 92.09,208.496 97.786,300.537c5.729,92.025 -7.324,144.157 -0.814,156.364c6.543,12.223 32.617,-15.462 88.005,-28.499c55.436,-13.037 140.185,-11.409 237.158,-76.562c97.005,-65.153 206.201,-197.086 301.546,-284.228c95.361,-87.158 176.839,-129.508 288.476,-158.008c111.686,-28.499 253.467,-43.164 334.147,-19.548c80.697,23.617 100.228,85.514 105.957,142.529c5.697,57.015 -2.458,109.131 -3.255,153.109c-0.846,43.978 5.697,79.818 17.904,72.493c12.24,-7.34 30.176,-57.829 3.271,-81.445c-26.904,-23.617 -98.616,-20.361 -273.828,23.617c-175.212,43.978 -453.939,128.678 -616.097,194.645c-162.191,65.967 -207.829,113.216 -262.418,135.205c-54.606,21.989 -118.18,18.734 -85.563,23.617c32.585,4.883 161.344,17.92 246.11,13.021c84.766,-4.883 125.504,-27.686 162.972,-69.222c37.5,-41.536 71.745,-101.807 92.936,-119.71c21.175,-17.92 29.313,6.51 13.835,46.403c-15.479,39.925 -54.59,95.296 -50.521,86.344c4.069,-8.952 51.335,-82.259 98.616,-131.95c47.266,-49.674 94.531,-75.732 105.111,-56.185c10.612,19.548 -15.479,84.7 -39.128,119.71c-23.633,35.026 -44.792,39.925 -21.973,7.34c22.819,-32.585 89.632,-102.62 132.015,-137.646c42.383,-35.01 60.286,-35.01 52.962,-1.611c-7.324,33.382 -39.941,100.163 -57.861,117.269c-17.92,17.106 -21.175,-15.479 18.734,-60.27c39.941,-44.792 123.063,-101.807 155.664,-101.807c32.601,0 14.665,57.015 -10.579,96.924c-25.26,39.909 -57.878,62.712 -47.266,35.026c10.579,-27.702 64.372,-105.892 105.941,-145.801c41.536,-39.893 70.898,-41.52 75.781,-13.021c4.883,28.499 -14.648,87.142 -38.314,117.269c-23.633,30.143 -51.335,31.771 -38.281,-5.697c13.021,-37.467 66.829,-114.014 109.212,-140.902c42.367,-26.872 73.324,-4.069 74.951,39.095c1.628,43.164 -26.074,106.689 -39.925,121.354c-13.851,14.665 -13.851,-19.548 8.968,-87.956c22.819,-68.408 68.457,-171.029 41.569,-211.751c-26.904,-40.723 -126.318,-19.548 -268.945,17.106c-142.611,36.637 -328.434,88.769 -476.758,109.131c-148.291,20.361 -259.147,8.952 -342.252,-7.34c-83.138,-16.276 -138.558,-37.467 -167.887,-82.259c-29.329,-44.792 -32.617,-113.2 -72.526,-153.109c-39.941,-39.909 -116.553,-51.302 -88.867,-52.116c27.734,-0.814 159.766,8.952 284.456,21.175c124.674,12.207 242.025,26.872 337.37,12.207c95.345,-14.648 168.701,-58.626 242.855,-77.36c74.186,-18.734 149.137,-12.223 243.669,-26.074c94.547,-13.835 208.642,-48.047 279.525,-61.084c70.898,-13.021 98.633,-4.883 114.095,37.467c15.495,42.35 18.75,118.913 23.649,111.588c4.899,-7.34 11.409,-98.551 -22.835,-167.79c-34.212,-69.222 -109.196,-116.455 -127.93,-118.896c-18.75,-2.441 18.734,39.909 17.936,51.302c-0.814,11.409 -39.941,-8.138 -76.628,-23.617c-36.67,-15.479 -70.882,-26.872 -105.941,-28.499c-35.042,-1.628 -70.882,6.51 -73.324,28.499c-2.458,21.989 28.499,57.829 42.367,57.829c13.835,0 10.579,-35.84 -19.564,-55.387c-30.159,-19.548 -87.191,-22.803 -111.637,0.016c-24.479,22.803 -16.309,71.663 6.152,81.396c22.445,9.733 59.18,-19.661 41.243,-43.278c-17.904,-23.617 -90.511,-41.471 -132.519,-33.284c-42.008,8.187 -53.434,42.399 -44.45,75.814c8.984,33.415 38.363,66.048 48.942,54.655c10.612,-11.409 2.409,-66.846 -44.873,-83.968c-47.266,-17.139 -133.659,4.036 -254.28,17.074c-120.589,13.021 -275.439,17.904 -393.62,11.393c-118.164,-6.51 -199.658,-24.43 -252.637,-50.488c-52.978,-26.074 -77.409,-60.27 -79.85,-50.505c-2.441,9.766 17.122,63.525 58.659,107.503c41.553,43.978 105.127,78.19 120.622,84.717c15.495,6.51 -17.122,-14.665 -8.138,-38.281c8.952,-23.617 59.473,-49.691 54.574,-81.445c-4.867,-31.771 -65.186,-69.238 -107.568,-86.344c-42.383,-17.09 -66.829,-13.835 -48.877,-1.628c17.92,12.223 78.239,33.398 160.531,23.633c82.308,-9.782 186.621,-50.505 245.312,-57.829c58.659,-7.34 71.712,18.734 61.1,39.095c-10.579,20.361 -44.824,35.01 -36.654,45.605c8.138,10.579 58.659,17.106 93.717,13.851c35.042,-3.271 54.606,-16.292 76.579,-34.212c22.038,-17.92 46.484,-40.723 62.76,-66.781c16.309,-26.074 24.479,-55.387 78.255,-73.307c53.792,-17.92 153.206,-24.43 219.222,-28.499c65.999,-4.085 98.616,-5.697 109.196,8.138c10.612,13.851 -0.814,43.164 -15.495,69.238c-14.648,26.058 -32.585,48.861 -9.098,59.44c23.519,10.596 88.444,8.968 128.369,-20.361c39.925,-29.313 54.883,-86.328 79.46,-123.779c24.593,-37.467 58.789,-55.387 75.098,-52.132c16.309,3.255 14.681,27.686 -3.255,40.723c-17.92,13.037 -52.132,14.648 -43.994,18.734c8.138,4.069 58.675,10.579 95.329,-11.409c36.686,-21.989 59.505,-72.477 60.319,-109.131c0.814,-36.654 -20.378,-59.456 -76.628,-55.387c-56.201,4.085 -147.477,35.026 -217.578,58.643c-70.085,23.617 -118.978,39.909 -156.478,59.456c-37.467,19.548 -63.558,42.35 -92.074,53.743c-28.516,11.409 -59.505,11.409 -56.25,-8.138c3.288,-19.548 40.755,-58.643 16.309,-65.153c-24.447,-6.51 -110.824,19.548 -223.568,50.635c-112.744,31.087 -251.807,67.187 -345.54,97.331c-93.717,30.127 -142.074,54.281 -220.85,48.454c-78.792,-5.843 -187.988,-41.683 -384.375,-49.805c-196.403,-8.154 -480.013,11.393 -666.634,40.706c-186.621,29.313 -276.269,68.408 -329.248,119.726c-52.962,51.302 -69.255,114.827 -79.394,192.106c-10.124,77.262 -14.079,168.245 -53.385,232.064c-39.323,63.818 -114.014,100.439 -188.704,137.077" style={{fill:"none",fillRule:"nonzero",stroke:"#021011",strokeWidth:"14.65px"}}/>
      </g>
    </g>
  </svg>
);

// ─── Constants ────────────────────────────────────────────────────────────────
const ESTADOS_PROYECTO = ["activo","pendiente_cotizacion","en_progreso","listo","entregado","cancelado"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const estadoBadge = (estado, darkMode) => {
  const dark = {
    activo:               "bg-sky-900/50 text-sky-300 border-sky-800",
    pendiente_cotizacion: "bg-amber-900/50 text-amber-300 border-amber-800",
    en_progreso:          "bg-blue-900/50 text-blue-300 border-blue-800",
    listo:                "bg-emerald-900/50 text-emerald-300 border-emerald-800",
    entregado:            "bg-teal-900/50 text-teal-300 border-teal-800",
    cancelado:            "bg-zinc-800 text-zinc-400 border-zinc-700",
  };
  const light = {
    activo:               "bg-sky-50 text-sky-700 border-sky-200",
    pendiente_cotizacion: "bg-amber-50 text-amber-700 border-amber-200",
    en_progreso:          "bg-blue-50 text-blue-700 border-blue-200",
    listo:                "bg-emerald-50 text-emerald-700 border-emerald-200",
    entregado:            "bg-teal-50 text-teal-700 border-teal-200",
    cancelado:            "bg-gray-100 text-gray-500 border-gray-200",
  };
  const m = darkMode ? dark : light;
  return m[estado] || (darkMode ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-gray-100 text-gray-500 border-gray-200");
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("es-MX", { dateStyle: "medium" }) : "—";

// ─── Global CSS animations (injected once) ────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .anim-fadeUp  { animation: fadeUp  0.3s cubic-bezier(0.22,1,0.36,1) both; }
    .anim-fadeIn  { animation: fadeIn  0.2s ease both; }
    .anim-slideDown { animation: slideDown 0.18s ease both; }
    .page-enter   { animation: fadeUp  0.28s cubic-bezier(0.22,1,0.36,1) both; }
  `}</style>
);

// ─── Shared UI primitives ─────────────────────────────────────────────────────
const Card = ({ darkMode, className = "", style = {}, children }) => (
  <div
    className={`rounded-xl border ${darkMode ? "bg-[#1e1e28] border-zinc-800" : "bg-white border-gray-200"} ${className}`}
    style={{ boxShadow: darkMode ? "0 4px 16px rgba(0,0,0,0.35)" : "0 2px 12px rgba(0,0,0,0.07)", ...style }}
  >
    {children}
  </div>
);

const Modal = ({ open, onClose, title, children, darkMode }) => {
  if (!open) return null;
  const card   = darkMode ? "bg-[#1e1e26] text-white"  : "bg-white text-gray-800";
  const border = darkMode ? "border-zinc-700/60"        : "border-gray-200";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 anim-fadeIn" onClick={onClose}>
      <div
        className={`anim-fadeUp relative w-full max-w-lg rounded-xl ${card} max-h-[90vh] overflow-y-auto`}
        style={{ boxShadow: darkMode ? "0 24px 64px rgba(0,0,0,0.6)" : "0 16px 48px rgba(0,0,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-6 py-4 border-b ${border}`}>
          <h2 className="font-semibold text-base">{title}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-current transition-colors text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

const Field = ({ label, required, children, darkMode }) => (
  <div className="flex flex-col gap-1.5">
    <label className={`text-[10px] font-semibold uppercase tracking-widest ${darkMode ? "text-zinc-500" : "text-gray-400"}`}>
      {label}{required && <span className="ml-0.5" style={{ color: C_RED }}>*</span>}
    </label>
    {children}
  </div>
);

const inputCls = (darkMode) =>
  `w-full rounded-md px-3 py-2 text-sm outline-none transition-colors border ${
    darkMode ? "bg-[#2a2a35] border-zinc-700 text-white placeholder-zinc-600" : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400"
  }`;

const Input = ({ darkMode, ...props }) => (
  <input {...props}
    className={`${inputCls(darkMode)} ${props.className || ""}`}
    onFocus={(e) => { e.target.style.borderColor = C_BLUE; props.onFocus?.(e); }}
    onBlur={(e)  => { e.target.style.borderColor = ""; props.onBlur?.(e); }}
  />
);

const Select = ({ darkMode, children, ...props }) => (
  <select {...props}
    className={inputCls(darkMode)}
    onFocus={(e) => (e.target.style.borderColor = C_BLUE)}
    onBlur={(e)  => (e.target.style.borderColor = "")}
  >{children}</select>
);

const Textarea = ({ darkMode, ...props }) => (
  <textarea {...props}
    className={`${inputCls(darkMode)} resize-none`}
    onFocus={(e) => (e.target.style.borderColor = C_BLUE)}
    onBlur={(e)  => (e.target.style.borderColor = "")}
  />
);

// Accent button (blue or red)
const BtnAccent = ({ onClick, disabled, color = C_BLUE, children, className = "" }) => (
  <button onClick={onClick} disabled={disabled}
    className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    style={{ backgroundColor: color, boxShadow: `0 2px 8px ${color}40` }}
    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
  >{children}</button>
);

// Ghost/outline buttons for table rows
const BtnEdit = ({ onClick, darkMode }) => (
  <button onClick={onClick}
    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
      darkMode ? "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200" : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"
    }`}
    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}
  >Editar</button>
);

const BtnToggleActive = ({ onClick, isActive, darkMode }) => (
  <button onClick={onClick}
    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
      isActive
        ? darkMode ? "border-zinc-700 text-zinc-400 hover:border-red-800 hover:text-red-400" : "border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500"
        : darkMode ? "border-zinc-700 text-zinc-400 hover:border-emerald-800 hover:text-emerald-400" : "border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600"
    }`}
    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}
  >{isActive ? "Desactivar" : "Activar"}</button>
);

const BtnCancelProject = ({ onClick, darkMode }) => (
  <button onClick={onClick}
    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
      darkMode ? "border-zinc-700 text-zinc-400 hover:border-red-800 hover:text-red-400" : "border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500"
    }`}
    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}
  >Cancelar</button>
);

// ─── ConfirmModal shorthand ────────────────────────────────────────────────────
const ConfirmModal = ({ open, onClose, title, message, onConfirm, confirmLabel, confirmColor = C_RED, darkMode }) => (
  <Modal open={open} onClose={onClose} title={title} darkMode={darkMode}>
    <p className={`text-sm mb-5 ${darkMode ? "text-zinc-400" : "text-gray-500"}`} dangerouslySetInnerHTML={{ __html: message }} />
    <div className="flex gap-3">
      <button onClick={onClose}
        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${darkMode ? "border-zinc-700 text-zinc-400 hover:text-zinc-200" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}
      >Cancelar</button>
      <BtnAccent onClick={onConfirm} color={confirmColor} className="flex-1 justify-center">{confirmLabel}</BtnAccent>
    </div>
  </Modal>
);

// ─── CLIENTES MODULE ──────────────────────────────────────────────────────────
const ClientesModule = ({ darkMode }) => {
  const [clientes,     setClientes]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [form,  setForm]  = useState({ nombre: "", telefono: "", correo: "", direccion: "", activo: true });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("clientes").select("*").order("created_at", { ascending: false });
    setClientes(data || []); setLoading(false);
  }, []);
  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  const openCreate = () => { setEditTarget(null); setForm({ nombre: "", telefono: "", correo: "", direccion: "", activo: true }); setFormError(""); setModalOpen(true); };
  const openEdit   = (c) => { setEditTarget(c); setForm({ nombre: c.nombre||"", telefono: c.telefono||"", correo: c.correo||"", direccion: c.direccion||"", activo: c.activo??true }); setFormError(""); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.telefono.trim()) { setFormError("Nombre y teléfono son obligatorios."); return; }
    setSaving(true); setFormError("");
    const { error } = editTarget
      ? await supabase.from("clientes").update({ ...form, updated_at: new Date().toISOString() }).eq("id", editTarget.id)
      : await supabase.from("clientes").insert([form]);
    setSaving(false);
    if (error) { setFormError(error.message); return; }
    setModalOpen(false); fetchClientes();
  };

  const handleToggle = async () => {
    if (!toggleTarget) return;
    await supabase.from("clientes").update({ activo: !toggleTarget.activo, updated_at: new Date().toISOString() }).eq("id", toggleTarget.id);
    setToggleTarget(null); fetchClientes();
  };

  const filtered = clientes.filter((c) =>
    c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.telefono?.includes(search) ||
    c.correo?.toLowerCase().includes(search.toLowerCase())
  );

  const t  = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";
  const divider = darkMode ? "divide-zinc-800" : "divide-gray-100";
  const rowH    = darkMode ? "hover:bg-[#25252f]" : "hover:bg-gray-50";
  const headTxt = darkMode ? "text-zinc-500 border-zinc-800" : "text-gray-400 border-gray-100";

  const activeBadge = (active) => active
    ? darkMode ? "bg-emerald-900/40 text-emerald-400 border-emerald-800" : "bg-emerald-50 text-emerald-700 border-emerald-200"
    : darkMode ? "bg-zinc-800 text-zinc-500 border-zinc-700"             : "bg-gray-100 text-gray-400 border-gray-200";

  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className={`text-lg font-semibold ${t}`}>Clientes</h2>
          <p className={`text-xs ${st} mt-0.5`}>{clientes.length} registros</p>
        </div>
        <BtnAccent onClick={openCreate} color={C_BLUE}>+ Nuevo Cliente</BtnAccent>
      </div>

      <div className="mb-4">
        <Input darkMode={darkMode} placeholder="Buscar por nombre, teléfono o correo…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card darkMode={darkMode} className="overflow-hidden">
        {loading ? (
          <div className={`p-12 text-center ${st} text-sm`}>Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className={`p-12 text-center ${st} text-sm`}>Sin resultados</div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b text-xs uppercase tracking-wider ${headTxt}`}>
                    {["Nombre","Teléfono","Correo","Dirección","Estado","Alta",""].map((h, i) => (
                      <th key={i} className={`px-5 py-3 font-medium ${i === 6 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${divider}`}>
                  {filtered.map((c) => (
                    <tr key={c.id} className={`transition-colors ${rowH}`}>
                      <td className={`px-5 py-3 font-medium ${t}`}>{c.nombre}</td>
                      <td className={`px-5 py-3 ${st}`}>{c.telefono}</td>
                      <td className={`px-5 py-3 ${st}`}>{c.correo || "—"}</td>
                      <td className={`px-5 py-3 ${st} max-w-[150px] truncate`}>{c.direccion || "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${activeBadge(c.activo)}`}>
                          {c.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className={`px-5 py-3 ${st} text-xs`}>{fmtDate(c.created_at)}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <BtnEdit onClick={() => openEdit(c)} darkMode={darkMode} />
                          <BtnToggleActive onClick={() => setToggleTarget(c)} isActive={c.activo} darkMode={darkMode} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile */}
            <div className={`md:hidden divide-y ${divider}`}>
              {filtered.map((c) => (
                <div key={c.id} className="px-4 py-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`font-medium ${t}`}>{c.nombre}</p>
                      <p className={`text-xs ${st}`}>{c.telefono}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${activeBadge(c.activo)}`}>
                      {c.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  {c.correo    && <p className={`text-xs ${st}`}>{c.correo}</p>}
                  {c.direccion && <p className={`text-xs ${st} truncate`}>{c.direccion}</p>}
                  <div className="flex gap-2 mt-1">
                    <BtnEdit onClick={() => openEdit(c)} darkMode={darkMode} />
                    <BtnToggleActive onClick={() => setToggleTarget(c)} isActive={c.activo} darkMode={darkMode} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Create/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "Editar Cliente" : "Nuevo Cliente"} darkMode={darkMode}>
        <div className="flex flex-col gap-4">
          <Field label="Nombre" required darkMode={darkMode}><Input darkMode={darkMode} value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} placeholder="Juan García" /></Field>
          <Field label="Teléfono" required darkMode={darkMode}><Input darkMode={darkMode} value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} placeholder="311 123 4567" /></Field>
          <Field label="Correo" darkMode={darkMode}><Input darkMode={darkMode} type="email" value={form.correo} onChange={(e) => setForm({...form, correo: e.target.value})} placeholder="juan@correo.com" /></Field>
          <Field label="Dirección" darkMode={darkMode}><Textarea darkMode={darkMode} rows={2} value={form.direccion} onChange={(e) => setForm({...form, direccion: e.target.value})} placeholder="Calle, Colonia, Ciudad" /></Field>
          <Field label="Estado" darkMode={darkMode}>
            <Select darkMode={darkMode} value={form.activo ? "true" : "false"} onChange={(e) => setForm({...form, activo: e.target.value === "true"})}>
              <option value="true">Activo</option><option value="false">Inactivo</option>
            </Select>
          </Field>
          {formError && <p className="text-xs" style={{ color: C_RED }}>{formError}</p>}
          <div className="flex gap-3 mt-1">
            <button onClick={() => setModalOpen(false)} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${darkMode ? "border-zinc-700 text-zinc-400" : "border-gray-200 text-gray-500"}`}>Cancelar</button>
            <BtnAccent onClick={handleSave} disabled={saving} color={C_BLUE} className="flex-1 justify-center">{saving ? "Guardando…" : editTarget ? "Actualizar" : "Crear"}</BtnAccent>
          </div>
        </div>
      </Modal>

      {/* Toggle confirm */}
      <ConfirmModal
        open={!!toggleTarget} onClose={() => setToggleTarget(null)}
        title={toggleTarget?.activo ? "Desactivar Cliente" : "Activar Cliente"}
        message={`¿${toggleTarget?.activo ? "Desactivar" : "Activar"} a <strong>${toggleTarget?.nombre}</strong>? El registro se conserva en el sistema.`}
        onConfirm={handleToggle}
        confirmLabel={toggleTarget?.activo ? "Desactivar" : "Activar"}
        confirmColor={toggleTarget?.activo ? C_RED : C_BLUE}
        darkMode={darkMode}
      />
    </div>
  );
};

// ─── VEHÍCULOS MODULE ─────────────────────────────────────────────────────────
const VehiculosModule = ({ darkMode }) => {
  const [vehiculos,    setVehiculos]    = useState([]);
  const [clientes,     setClientes]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [form,  setForm]    = useState({ cliente_id: "", marca: "", modelo: "", anio: "", placas: "", vin: "", color: "", activo: true });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [v, c] = await Promise.all([
      supabase.from("vehiculos").select("*, clientes(nombre)").order("created_at", { ascending: false }),
      supabase.from("clientes").select("id,nombre").eq("activo", true).order("nombre"),
    ]);
    setVehiculos(v.data || []); setClientes(c.data || []); setLoading(false);
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openCreate = () => { setEditTarget(null); setForm({ cliente_id: "", marca: "", modelo: "", anio: "", placas: "", vin: "", color: "", activo: true }); setFormError(""); setModalOpen(true); };
  const openEdit   = (v) => { setEditTarget(v); setForm({ cliente_id: v.cliente_id||"", marca: v.marca||"", modelo: v.modelo||"", anio: v.anio||"", placas: v.placas||"", vin: v.vin||"", color: v.color||"", activo: v.activo??true }); setFormError(""); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.cliente_id || !form.marca.trim() || !form.modelo.trim() || !form.placas.trim()) {
      setFormError("Cliente, marca, modelo y placas son obligatorios."); return;
    }
    if (form.anio && (isNaN(form.anio) || form.anio < 1900 || form.anio > new Date().getFullYear() + 1)) {
      setFormError("Año inválido."); return;
    }
    setSaving(true); setFormError("");
    const payload = { cliente_id: form.cliente_id, marca: form.marca, modelo: form.modelo, anio: form.anio ? parseInt(form.anio) : null, placas: form.placas.toUpperCase(), vin: form.vin || null, color: form.color || null, activo: form.activo, updated_at: new Date().toISOString() };
    const { error } = editTarget
      ? await supabase.from("vehiculos").update(payload).eq("id", editTarget.id)
      : await supabase.from("vehiculos").insert([payload]);
    setSaving(false);
    if (error) { setFormError(error.message); return; }
    setModalOpen(false); fetchAll();
  };

  const handleToggle = async () => {
    if (!toggleTarget) return;
    await supabase.from("vehiculos").update({ activo: !toggleTarget.activo, updated_at: new Date().toISOString() }).eq("id", toggleTarget.id);
    setToggleTarget(null); fetchAll();
  };

  const filtered = vehiculos.filter((v) =>
    v.marca?.toLowerCase().includes(search.toLowerCase()) ||
    v.modelo?.toLowerCase().includes(search.toLowerCase()) ||
    v.placas?.toLowerCase().includes(search.toLowerCase()) ||
    v.clientes?.nombre?.toLowerCase().includes(search.toLowerCase())
  );

  const t  = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";
  const divider = darkMode ? "divide-zinc-800" : "divide-gray-100";
  const rowH    = darkMode ? "hover:bg-[#25252f]" : "hover:bg-gray-50";
  const headTxt = darkMode ? "text-zinc-500 border-zinc-800" : "text-gray-400 border-gray-100";

  const activeBadge = (active) => active
    ? darkMode ? "bg-emerald-900/40 text-emerald-400 border-emerald-800" : "bg-emerald-50 text-emerald-700 border-emerald-200"
    : darkMode ? "bg-zinc-800 text-zinc-500 border-zinc-700"             : "bg-gray-100 text-gray-400 border-gray-200";

  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className={`text-lg font-semibold ${t}`}>Vehículos</h2>
          <p className={`text-xs ${st} mt-0.5`}>{vehiculos.length} registros</p>
        </div>
        <BtnAccent onClick={openCreate} color={C_BLUE}>+ Nuevo Vehículo</BtnAccent>
      </div>

      <div className="mb-4">
        <Input darkMode={darkMode} placeholder="Buscar por marca, modelo, placas o cliente…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card darkMode={darkMode} className="overflow-hidden">
        {loading ? (
          <div className={`p-12 text-center ${st} text-sm`}>Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className={`p-12 text-center ${st} text-sm`}>Sin resultados</div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b text-xs uppercase tracking-wider ${headTxt}`}>
                    {["Cliente","Marca","Modelo","Año","Placas","VIN","Color","Estado",""].map((h, i) => (
                      <th key={i} className={`px-4 py-3 font-medium ${i === 8 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${divider}`}>
                  {filtered.map((v) => (
                    <tr key={v.id} className={`transition-colors ${rowH}`}>
                      <td className={`px-4 py-3 ${st}`}>{v.clientes?.nombre || "—"}</td>
                      <td className={`px-4 py-3 font-medium ${t}`}>{v.marca}</td>
                      <td className={`px-4 py-3 ${t}`}>{v.modelo}</td>
                      <td className={`px-4 py-3 ${st}`}>{v.anio || "—"}</td>
                      <td className={`px-4 py-3 font-mono text-xs ${t}`}>{v.placas}</td>
                      <td className={`px-4 py-3 font-mono text-xs ${st}`}>{v.vin || "—"}</td>
                      <td className={`px-4 py-3 ${st}`}>{v.color || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${activeBadge(v.activo)}`}>
                          {v.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <BtnEdit onClick={() => openEdit(v)} darkMode={darkMode} />
                          <BtnToggleActive onClick={() => setToggleTarget(v)} isActive={v.activo} darkMode={darkMode} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile */}
            <div className={`md:hidden divide-y ${divider}`}>
              {filtered.map((v) => (
                <div key={v.id} className="px-4 py-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`font-medium ${t}`}>{v.marca} {v.modelo}</p>
                      <p className={`text-xs font-mono ${st}`}>{v.placas}{v.anio ? ` · ${v.anio}` : ""}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${activeBadge(v.activo)}`}>
                      {v.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <p className={`text-xs ${st}`}>Cliente: {v.clientes?.nombre || "—"}</p>
                  {v.color && <p className={`text-xs ${st}`}>Color: {v.color}</p>}
                  {v.vin && <p className={`text-xs font-mono ${st}`}>VIN: {v.vin}</p>}
                  <div className="flex gap-2 mt-1">
                    <BtnEdit onClick={() => openEdit(v)} darkMode={darkMode} />
                    <BtnToggleActive onClick={() => setToggleTarget(v)} isActive={v.activo} darkMode={darkMode} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Create/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "Editar Vehículo" : "Nuevo Vehículo"} darkMode={darkMode}>
        <div className="flex flex-col gap-4">
          <Field label="Cliente" required darkMode={darkMode}>
            <Select darkMode={darkMode} value={form.cliente_id} onChange={(e) => setForm({...form, cliente_id: e.target.value})}>
              <option value="">Seleccionar cliente…</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Marca" required darkMode={darkMode}><Input darkMode={darkMode} value={form.marca} onChange={(e) => setForm({...form, marca: e.target.value})} placeholder="Toyota" /></Field>
            <Field label="Modelo" required darkMode={darkMode}><Input darkMode={darkMode} value={form.modelo} onChange={(e) => setForm({...form, modelo: e.target.value})} placeholder="Corolla" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Año" darkMode={darkMode}><Input darkMode={darkMode} type="number" value={form.anio} onChange={(e) => setForm({...form, anio: e.target.value})} placeholder="2018" /></Field>
            <Field label="Color" darkMode={darkMode}><Input darkMode={darkMode} value={form.color} onChange={(e) => setForm({...form, color: e.target.value})} placeholder="Blanco" /></Field>
          </div>
          <Field label="Placas" required darkMode={darkMode}>
            <Input darkMode={darkMode} value={form.placas} onChange={(e) => setForm({...form, placas: e.target.value.toUpperCase()})} placeholder="ABC-123-D" className="font-mono" />
          </Field>
          <Field label="VIN" darkMode={darkMode}>
            <Input darkMode={darkMode} value={form.vin} onChange={(e) => setForm({...form, vin: e.target.value.toUpperCase()})} placeholder="1HGCM82633A123456" className="font-mono" />
          </Field>
          <Field label="Estado" darkMode={darkMode}>
            <Select darkMode={darkMode} value={form.activo ? "true" : "false"} onChange={(e) => setForm({...form, activo: e.target.value === "true"})}>
              <option value="true">Activo</option><option value="false">Inactivo</option>
            </Select>
          </Field>
          {formError && <p className="text-xs" style={{ color: C_RED }}>{formError}</p>}
          <div className="flex gap-3 mt-1">
            <button onClick={() => setModalOpen(false)} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${darkMode ? "border-zinc-700 text-zinc-400" : "border-gray-200 text-gray-500"}`}>Cancelar</button>
            <BtnAccent onClick={handleSave} disabled={saving} color={C_BLUE} className="flex-1 justify-center">{saving ? "Guardando…" : editTarget ? "Actualizar" : "Crear"}</BtnAccent>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!toggleTarget} onClose={() => setToggleTarget(null)}
        title={toggleTarget?.activo ? "Desactivar Vehículo" : "Activar Vehículo"}
        message={`¿${toggleTarget?.activo ? "Desactivar" : "Activar"} el vehículo <strong>${toggleTarget?.marca} ${toggleTarget?.modelo} (${toggleTarget?.placas})</strong>?`}
        onConfirm={handleToggle}
        confirmLabel={toggleTarget?.activo ? "Desactivar" : "Activar"}
        confirmColor={toggleTarget?.activo ? C_RED : C_BLUE}
        darkMode={darkMode}
      />
    </div>
  );
};

// ─── PROYECTOS MODULE ─────────────────────────────────────────────────────────
const ProyectosModule = ({ darkMode }) => {
  const [proyectos,  setProyectos]  = useState([]);
  const [clientes,   setClientes]   = useState([]);
  const [vehiculos,  setVehiculos]  = useState([]);
  const [empleados,  setEmpleados]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ titulo: "", descripcion: "", cliente_id: "", vehiculo_id: "", mecanico_id: "", estado: "activo", bloqueado: false });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [filteredVehiculos, setFilteredVehiculos] = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [p, c, v, e] = await Promise.all([
      supabase.from("proyectos").select("*, clientes(nombre), vehiculos(marca,modelo,placas), empleados(nombre)").order("created_at", { ascending: false }),
      supabase.from("clientes").select("id,nombre").eq("activo", true).order("nombre"),
      supabase.from("vehiculos").select("id,cliente_id,marca,modelo,placas").eq("activo", true),
      supabase.from("empleados").select("id,nombre").eq("activo", true).order("nombre"),
    ]);
    setProyectos(p.data||[]); setClientes(c.data||[]); setVehiculos(v.data||[]); setEmpleados(e.data||[]); setLoading(false);
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    setFilteredVehiculos(form.cliente_id ? vehiculos.filter((v) => v.cliente_id === form.cliente_id) : []);
  }, [form.cliente_id, vehiculos]);

  const openCreate = () => { setEditTarget(null); setForm({ titulo: "", descripcion: "", cliente_id: "", vehiculo_id: "", mecanico_id: "", estado: "activo", bloqueado: false }); setFormError(""); setModalOpen(true); };
  const openEdit   = (p) => { setEditTarget(p); setForm({ titulo: p.titulo||"", descripcion: p.descripcion||"", cliente_id: p.cliente_id||"", vehiculo_id: p.vehiculo_id||"", mecanico_id: p.mecanico_id||"", estado: p.estado||"activo", bloqueado: p.bloqueado??false }); setFormError(""); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.cliente_id || !form.vehiculo_id) { setFormError("Título, cliente y vehículo son obligatorios."); return; }
    setSaving(true); setFormError("");
    const payload = { titulo: form.titulo, descripcion: form.descripcion||null, cliente_id: form.cliente_id, vehiculo_id: form.vehiculo_id, mecanico_id: form.mecanico_id||null, estado: form.estado, bloqueado: form.bloqueado, updated_at: new Date().toISOString() };
    const { error } = editTarget
      ? await supabase.from("proyectos").update(payload).eq("id", editTarget.id)
      : await supabase.from("proyectos").insert([{ ...payload, fecha_ingreso: new Date().toISOString() }]);
    setSaving(false);
    if (error) { setFormError(error.message); return; }
    setModalOpen(false); fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("proyectos").update({ estado: "cancelado" }).eq("id", deleteTarget.id);
    setDeleteTarget(null); fetchAll();
  };

  const filtered = proyectos.filter((p) => {
    const q = search.toLowerCase();
    return (p.titulo?.toLowerCase().includes(q) || p.clientes?.nombre?.toLowerCase().includes(q) || p.vehiculos?.placas?.toLowerCase().includes(q))
      && (filterEstado === "todos" || p.estado === filterEstado);
  });

  const t  = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";
  const divider = darkMode ? "divide-zinc-800" : "divide-gray-100";
  const rowH    = darkMode ? "hover:bg-[#25252f]" : "hover:bg-gray-50";
  const headTxt = darkMode ? "text-zinc-500 border-zinc-800" : "text-gray-400 border-gray-100";

  const filterBtnCls = (active) => active
    ? "border text-xs font-medium px-3 py-1.5 rounded-md border-zinc-600 text-zinc-200 bg-zinc-700"
    : darkMode
    ? "border text-xs font-medium px-3 py-1.5 rounded-md border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
    : "border text-xs font-medium px-3 py-1.5 rounded-md border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600";

  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className={`text-lg font-semibold ${t}`}>Proyectos</h2>
          <p className={`text-xs ${st} mt-0.5`}>{proyectos.length} proyectos</p>
        </div>
        <BtnAccent onClick={openCreate} color={C_RED}>+ Nuevo Proyecto</BtnAccent>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1"><Input darkMode={darkMode} placeholder="Buscar por título, cliente o placas…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <div className="flex gap-1.5 flex-wrap items-center">
          {["todos", ...ESTADOS_PROYECTO].map((e) => (
            <button key={e} onClick={() => setFilterEstado(e)} className={`capitalize ${filterBtnCls(filterEstado === e)}`}>
              {e === "todos" ? "Todos" : e.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
        {ESTADOS_PROYECTO.map((e) => {
          const count = proyectos.filter((p) => p.estado === e).length;
          return (
            <Card key={e} darkMode={darkMode}
              className={`px-3 py-2.5 text-center cursor-pointer transition-opacity hover:opacity-80 ${filterEstado === e ? "ring-1 ring-inset" : ""}`}
              style={{ ringColor: C_BLUE }}
              onClick={() => setFilterEstado(e === filterEstado ? "todos" : e)}
            >
              <p className={`text-base font-semibold ${estadoBadge(e, darkMode).split(" ")[1]}`}>{count}</p>
              <p className={`text-[9px] uppercase tracking-wider ${st} mt-0.5`}>{e.replace(/_/g, " ")}</p>
            </Card>
          );
        })}
      </div>

      <Card darkMode={darkMode} className="overflow-hidden">
        {loading ? (
          <div className={`p-12 text-center ${st} text-sm`}>Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className={`p-12 text-center ${st} text-sm`}>Sin resultados</div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b text-xs uppercase tracking-wider ${headTxt}`}>
                    {["Título","Cliente","Vehículo","Mecánico","Estado","Ingreso",""].map((h, i) => (
                      <th key={i} className={`px-5 py-3 font-medium ${i === 6 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${divider}`}>
                  {filtered.map((p) => (
                    <tr key={p.id} className={`transition-colors ${rowH}`}>
                      <td className={`px-5 py-3 font-medium ${t} max-w-[160px] truncate`}>{p.bloqueado && <span className="mr-1 text-amber-500 text-xs">🔒</span>}{p.titulo}</td>
                      <td className={`px-5 py-3 ${st}`}>{p.clientes?.nombre || "—"}</td>
                      <td className={`px-5 py-3 ${st} text-xs`}>{p.vehiculos ? `${p.vehiculos.marca} ${p.vehiculos.modelo} · ${p.vehiculos.placas}` : "—"}</td>
                      <td className={`px-5 py-3 ${st}`}>{p.empleados?.nombre || "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border capitalize ${estadoBadge(p.estado, darkMode)}`}>{p.estado.replace(/_/g, " ")}</span>
                      </td>
                      <td className={`px-5 py-3 ${st} text-xs`}>{fmtDate(p.fecha_ingreso)}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <BtnEdit onClick={() => openEdit(p)} darkMode={darkMode} />
                          <BtnCancelProject onClick={() => setDeleteTarget(p)} darkMode={darkMode} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile */}
            <div className={`md:hidden divide-y ${divider}`}>
              {filtered.map((p) => (
                <div key={p.id} className="px-4 py-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-medium ${t}`}>{p.bloqueado && "🔒 "}{p.titulo}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 capitalize ${estadoBadge(p.estado, darkMode)}`}>{p.estado.replace(/_/g, " ")}</span>
                  </div>
                  <p className={`text-xs ${st}`}>{p.clientes?.nombre} · {p.vehiculos ? `${p.vehiculos.marca} ${p.vehiculos.modelo}` : "—"}</p>
                  {p.empleados && <p className={`text-xs ${st}`}>Mecánico: {p.empleados.nombre}</p>}
                  <div className="flex gap-2 mt-1">
                    <BtnEdit onClick={() => openEdit(p)} darkMode={darkMode} />
                    <BtnCancelProject onClick={() => setDeleteTarget(p)} darkMode={darkMode} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Create/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "Editar Proyecto" : "Nuevo Proyecto"} darkMode={darkMode}>
        <div className="flex flex-col gap-4">
          <Field label="Título del Proyecto" required darkMode={darkMode}><Input darkMode={darkMode} value={form.titulo} onChange={(e) => setForm({...form, titulo: e.target.value})} placeholder="Diagnóstico general / Cambio de frenos…" /></Field>
          <Field label="Descripción" darkMode={darkMode}><Textarea darkMode={darkMode} rows={3} value={form.descripcion} onChange={(e) => setForm({...form, descripcion: e.target.value})} placeholder="Detalles del servicio…" /></Field>
          <Field label="Cliente" required darkMode={darkMode}>
            <Select darkMode={darkMode} value={form.cliente_id} onChange={(e) => setForm({...form, cliente_id: e.target.value, vehiculo_id: ""})}>
              <option value="">Seleccionar cliente…</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
          </Field>
          <Field label="Vehículo" required darkMode={darkMode}>
            <Select darkMode={darkMode} value={form.vehiculo_id} onChange={(e) => setForm({...form, vehiculo_id: e.target.value})} disabled={!form.cliente_id}>
              <option value="">{form.cliente_id ? "Seleccionar vehículo…" : "Primero selecciona un cliente"}</option>
              {filteredVehiculos.map((v) => <option key={v.id} value={v.id}>{v.marca} {v.modelo} · {v.placas}</option>)}
            </Select>
          </Field>
          <Field label="Mecánico Asignado" darkMode={darkMode}>
            <Select darkMode={darkMode} value={form.mecanico_id} onChange={(e) => setForm({...form, mecanico_id: e.target.value})}>
              <option value="">Sin asignar</option>
              {empleados.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </Select>
          </Field>
          <Field label="Estado" darkMode={darkMode}>
            <Select darkMode={darkMode} value={form.estado} onChange={(e) => setForm({...form, estado: e.target.value})}>
              {ESTADOS_PROYECTO.map((e) => <option key={e} value={e}>{e.replace(/_/g, " ")}</option>)}
            </Select>
          </Field>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="bloqueado" checked={form.bloqueado} onChange={(e) => setForm({...form, bloqueado: e.target.checked})} className="w-4 h-4" style={{ accentColor: C_BLUE }} />
            <label htmlFor="bloqueado" className={`text-sm ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>Bloqueado (entrega pendiente de pago)</label>
          </div>
          {formError && <p className="text-xs" style={{ color: C_RED }}>{formError}</p>}
          <div className="flex gap-3 mt-1">
            <button onClick={() => setModalOpen(false)} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${darkMode ? "border-zinc-700 text-zinc-400" : "border-gray-200 text-gray-500"}`}>Cancelar</button>
            <BtnAccent onClick={handleSave} disabled={saving} color={C_RED} className="flex-1 justify-center">{saving ? "Guardando…" : editTarget ? "Actualizar" : "Crear"}</BtnAccent>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        title="Cancelar Proyecto"
        message={`¿Cancelar el proyecto <strong>${deleteTarget?.titulo}</strong>? El estado cambiará a "cancelado".`}
        onConfirm={handleDelete} confirmLabel="Cancelar Proyecto" confirmColor={C_RED} darkMode={darkMode}
      />
    </div>
  );
};

// ─── Protected Route ──────────────────────────────────────────────────────────
const ProtectedRoute = ({ session, children }) => {
  if (!session) return <Navigate to="/login" replace />;
  return children;
};

// ─── User menu (top-right avatar + dropdown) ──────────────────────────────────
const UserMenu = ({ session, onLogout, darkMode }) => {
  const [open, setOpen] = useClickOutside();
  const email = session?.user?.email || "";
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg transition-colors"
        style={{ background: open ? (darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)") : "transparent" }}
      >
        {/* Avatar circle */}
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
          style={{ backgroundColor: C_BLUE, boxShadow: "0 1px 6px rgba(96,174,187,0.35)" }}
        >
          {initials}
        </div>
        <span className={`text-xs font-medium hidden sm:block max-w-[120px] truncate ${darkMode ? "text-zinc-300" : "text-gray-600"}`}>{email}</span>
        {/* Chevron */}
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M1 1l4 4 4-4" stroke={darkMode ? "#71717a" : "#9ca3af"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          className={`anim-slideDown absolute right-0 top-full mt-1.5 w-52 rounded-xl border py-1 z-50 ${darkMode ? "bg-[#1e1e28] border-zinc-700" : "bg-white border-gray-200"}`}
          style={{ boxShadow: darkMode ? "0 12px 32px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.12)" }}
        >
          {/* User info header */}
          <div className={`px-4 py-2.5 border-b ${darkMode ? "border-zinc-800" : "border-gray-100"}`}>
            <p className={`text-xs font-medium truncate ${darkMode ? "text-zinc-200" : "text-gray-700"}`}>{email}</p>
            <p className={`text-[10px] ${darkMode ? "text-zinc-500" : "text-gray-400"} mt-0.5`}>Administrador</p>
          </div>
          {/* Actions */}
          <button
            onClick={() => { setOpen(false); onLogout(); }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${darkMode ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
};

// Hook: close dropdown when clicking outside
function useClickOutside() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  // attach ref to the wrapper in the component
  return [open, setOpen, ref];
}

// Override UserMenu to use the ref properly
const UserMenuWithRef = ({ session, onLogout, darkMode }) => {
  const [open, setOpen, ref] = useClickOutside();
  const email = session?.user?.email || "";
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg transition-colors"
        style={{ background: open ? (darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)") : "transparent" }}
      >
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
          style={{ backgroundColor: C_BLUE, boxShadow: "0 1px 6px rgba(96,174,187,0.3)" }}
        >{initials}</div>
        <span className={`text-xs font-medium hidden sm:block max-w-[120px] truncate ${darkMode ? "text-zinc-300" : "text-gray-600"}`}>{email}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}>
          <path d="M1 1l4 4 4-4" stroke={darkMode ? "#71717a" : "#9ca3af"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div
          className={`anim-slideDown absolute right-0 top-full mt-2 w-52 rounded-xl border py-1 z-50 ${darkMode ? "bg-[#1e1e28] border-zinc-700" : "bg-white border-gray-200"}`}
          style={{ boxShadow: darkMode ? "0 12px 32px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.12)" }}
        >
          <div className={`px-4 py-2.5 border-b ${darkMode ? "border-zinc-800" : "border-gray-100"}`}>
            <p className={`text-xs font-medium truncate ${darkMode ? "text-zinc-200" : "text-gray-700"}`}>{email}</p>
            <p className={`text-[10px] ${darkMode ? "text-zinc-500" : "text-gray-400"} mt-0.5`}>Administrador</p>
          </div>
          <button
            onClick={() => { setOpen(false); onLogout(); }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${darkMode ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}
          >Cerrar sesión</button>
        </div>
      )}
    </div>
  );
};

// ─── Dashboard shell ──────────────────────────────────────────────────────────
const Dashboard = ({ session, darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState("clientes");
  const [sidebarOpen,  setSidebarOpen]  = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { id: "clientes",   label: "Clientes",   icon: "👥" },
    { id: "vehiculos",  label: "Vehículos",  icon: "🚗" },
    { id: "proyectos",  label: "Proyectos",  icon: "🔧" },
  ];

  const topbar = darkMode ? "bg-[#12121a] border-zinc-800" : "bg-white border-gray-200";
  const sidebar = darkMode ? "bg-[#12121a] border-zinc-800" : "bg-white border-gray-200";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";

  const NavItem = ({ item }) => {
    const active = activeModule === item.id;
    return (
      <button
        onClick={() => { setActiveModule(item.id); setSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors border ${
          active
            ? darkMode ? "bg-zinc-800 text-zinc-100 border-zinc-700" : "bg-gray-100 text-gray-800 border-gray-200"
            : darkMode ? "text-zinc-500 border-transparent hover:bg-zinc-800/60 hover:text-zinc-300" : "text-gray-400 border-transparent hover:bg-gray-50 hover:text-gray-700"
        }`}
        style={active ? { boxShadow: "0 1px 4px rgba(0,0,0,0.2)" } : {}}
      >
        <span>{item.icon}</span>
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? "bg-[#16161e] text-white" : "bg-gray-50 text-gray-800"}`}>
      <GlobalStyles />

      {/* Top bar */}
      <header
        className={`fixed top-0 inset-x-0 z-30 flex items-center justify-between px-4 border-b ${topbar}`}
        style={{ height: "52px", boxShadow: darkMode ? "0 1px 0 rgba(255,255,255,0.03), 0 4px 12px rgba(0,0,0,0.3)" : "0 1px 0 rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center gap-3">
          <button className="md:hidden p-1.5 rounded text-zinc-500 hover:text-zinc-300" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg width="16" height="12" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M0 1h16M0 6h16M0 11h16"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <LogoMark className="h-6 w-auto" />
            <span className="font-semibold text-sm hidden sm:block" style={{ color: C_BLUE }}>Stathmos</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Dark/light toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Modo claro" : "Modo oscuro"}
            className={`relative w-10 h-5 rounded-full transition-colors ${darkMode ? "bg-zinc-700" : "bg-gray-300"}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${darkMode ? "translate-x-5 bg-zinc-300" : "translate-x-0.5 bg-white shadow"}`} />
          </button>

          {/* User menu */}
          <UserMenuWithRef session={session} onLogout={handleLogout} darkMode={darkMode} />
        </div>
      </header>

      <div className="flex flex-1 pt-[52px]">
        {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Sidebar */}
        <aside
          className={`fixed md:sticky top-[52px] left-0 h-[calc(100vh-52px)] w-52 border-r flex flex-col z-20 transition-transform duration-200 ${sidebar} ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
          style={{ boxShadow: darkMode ? "1px 0 0 rgba(255,255,255,0.02)" : "1px 0 0 rgba(0,0,0,0.04)" }}
        >
          <nav className="flex-1 p-3 flex flex-col gap-1">
            <p className={`text-[10px] font-semibold uppercase tracking-widest px-3 py-2 ${st}`}>Módulos</p>
            {navItems.map((item) => <NavItem key={item.id} item={item} />)}
          </nav>
          <div className={`px-4 py-3 border-t ${darkMode ? "border-zinc-800" : "border-gray-100"}`}>
            <p className={`text-[10px] ${st}`}>v2.0 · Taller Don Elías</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-auto">
          {activeModule === "clientes"  && <ClientesModule  darkMode={darkMode} />}
          {activeModule === "vehiculos" && <VehiculosModule darkMode={darkMode} />}
          {activeModule === "proyectos" && <ProyectosModule darkMode={darkMode} />}
        </main>
      </div>
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [session,     setSession]     = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [darkMode,    setDarkMode]    = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#16161e] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-800 animate-spin" style={{ borderTopColor: C_BLUE }} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/dashboard" element={<ProtectedRoute session={session}><Dashboard session={session} darkMode={darkMode} setDarkMode={setDarkMode} /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={session ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}