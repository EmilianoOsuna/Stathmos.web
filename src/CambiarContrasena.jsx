import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "./supabase";
import { Icon, Input, Button } from "./components/UIPrimitives";

// ─── Logo (reutilizado del Login) ─────────────────────────────────────────────
const Logo = ({ className = "", darkMode }) => (
  <svg className={className} viewBox="0 0 6000 3375" xmlns="http://www.w3.org/2000/svg"
    style={{ fillRule:"evenodd", clipRule:"evenodd", strokeLinecap:"round", strokeLinejoin:"round", strokeMiterlimit:"22.926" }}
  >
    <path d="M1577.067,1787.012c-41.243,48.193 -29.069,158.236 92.22,221.712c121.305,63.46 351.725,80.355 582.682,73.161c230.957,-7.178 462.419,-38.444 626.383,-135.352c163.981,-96.891 260.465,-259.424 230.111,-306.413c-30.339,-46.973 -187.533,21.598 -425.472,61.865c-237.939,40.251 -556.657,52.181 -763.33,51.318c-206.689,-0.846 -301.351,-14.486 -342.594,33.708" style={{fill:"#db3c1c"}}/>
    <path d="M3876.888,1411.263c-87.044,-27.832 -283.398,-79.297 -556.299,-56.999c-272.917,22.298 -622.428,118.359 -967.546,176.042c-345.117,57.682 -685.856,77.002 -787.549,113.737c-101.709,36.719 35.645,90.853 242.139,122.054c206.494,31.201 482.145,39.469 786.768,-5.99c304.59,-45.459 638.151,-144.629 863.818,-205.697c225.684,-61.051 343.506,-84.001 413.509,-97.575c70.003,-13.558 92.22,-17.757 5.16,-45.573" style={{fill:"#60aebb"}}/>
    <g>
      <clipPath id="lc1"><rect x="713.021" y="858.333" width="4574.479" height="1658.333"/></clipPath>
      <g clipPath="url(#lc1)">
        <path d="M4795.652,1205.209c-90.706,-21.338 -181.413,-42.676 -279.736,-54.167c-98.34,-11.475 -204.281,-13.102 -262.939,-5.778c-58.691,7.324 -70.117,23.617 -39.469,44.01c30.68,20.378 103.402,44.857 130.29,50.553c26.888,5.713 7.975,-7.373 -137.614,-61.963c-145.54,-54.59 -417.757,-150.683 -619.856,-213.395c-202.1,-62.712 -334.131,-92.041 -519.108,-96.11c-184.993,-4.069 -422.965,17.106 -617.741,61.084c-194.775,43.978 -346.354,110.758 -477.555,191.39c-131.217,80.631 -242.041,175.098 -227.376,164.518c14.665,-10.596 154.834,-126.237 337.386,-182.438c182.552,-56.201 407.471,-52.93 594.922,-18.734c187.435,34.212 337.386,99.365 445.768,137.646c108.398,38.281 175.212,49.674 274.642,58.643c99.43,8.952 231.445,15.462 350.407,34.196c119.01,18.734 224.951,49.691 251.025,47.233c26.074,-2.425 -27.702,-38.265 -184.163,-65.967c-156.494,-27.686 -415.641,-47.233 -726.123,-32.568c-310.498,14.665 -672.347,63.525 -916.015,92.838c-243.669,29.329 -369.173,39.095 -469.417,39.095c-100.228,0 -175.212,-9.766 -205.355,-31.755c-30.159,-21.989 -15.495,-56.201 25.26,-79.818c40.739,-23.617 107.568,-36.654 135.27,-27.686c27.718,8.952 16.309,39.893 0,66.781c-16.292,26.872 -37.484,49.674 -61.93,52.116c-24.447,2.441 -52.165,-15.462 -57.047,-35.84c-4.883,-20.361 13.037,-43.164 39.111,-60.254c26.09,-17.106 60.319,-28.516 52.978,-11.409c-7.34,17.106 -56.234,62.712 -132.845,91.211c-76.595,28.516 -180.908,39.909 -268.929,48.063c-88.005,8.138 -159.733,13.021 -193.148,26.058c-33.398,13.037 -28.516,34.212 -13.851,41.536c14.681,7.324 39.128,0.814 59.505,-12.223c20.361,-13.037 36.67,-32.568 15.479,-34.196c-21.191,-1.628 -79.866,14.648 -126.318,36.654c-46.452,21.973 -80.68,49.674 -108.398,118.896c-27.702,69.222 -48.893,179.997 -66.829,257.373c-17.92,77.36 -32.585,121.338 -31.771,147.396c0.814,26.074 17.106,34.212 12.223,48.063c-4.883,13.835 -30.973,33.382 -46.452,35.01c-15.479,1.628 -20.378,-14.648 8.968,-11.393c29.329,3.255 92.904,26.058 136.084,38.281c43.197,12.207 66.016,13.835 70.898,-6.51c4.899,-20.361 -8.138,-62.728 -27.702,-82.259c-19.548,-19.548 -45.638,-16.309 -69.255,-16.309c-23.633,0 -44.824,-3.239 -43.197,-21.973c1.628,-18.734 26.074,-52.946 52.962,-60.27c26.888,-7.324 56.234,12.207 52.148,14.648c-4.069,2.458 -41.553,-12.207 -57.845,-47.233c-16.309,-35.026 -11.409,-90.397 6.51,-136.816c17.936,-46.419 48.909,-83.887 65.202,-93.669c16.292,-9.766 17.936,8.154 10.596,43.978c-7.34,35.84 -23.633,89.6 -32.601,130.322c-8.968,40.706 -10.596,68.408 -6.527,35.01c4.069,-33.382 13.867,-127.864 41.569,-195.459c27.702,-67.594 73.34,-108.333 132.015,-126.237c58.691,-17.92 130.404,-13.037 193.978,22.803c63.558,35.84 118.978,102.62 145.866,192.204c26.888,89.583 25.26,201.986 16.292,281.803c-8.952,79.801 -25.26,127.034 -68.441,161.247c-43.197,34.212 -113.281,55.387 -175.228,49.691c-61.93,-5.697 -115.723,-38.281 -156.478,-107.519c-40.739,-69.222 -68.441,-175.098 -68.441,-268.75c0,-93.669 27.702,-175.114 64.372,-223.161c36.686,-48.047 82.324,-62.712 110.026,-68.408c27.702,-5.697 37.484,-2.458 30.143,11.393c-7.324,13.851 -31.787,38.281 -30.143,81.445c1.628,43.164 29.329,105.062 34.228,102.62c4.883,-2.441 -13.037,-69.222 -4.085,-104.248c8.968,-35.01 44.824,-38.281 82.324,-5.697c37.484,32.585 76.595,100.993 92.887,180.81c16.309,79.801 9.798,171.029 -25.244,231.299c-35.042,60.27 -98.616,89.583 -154.036,76.546c-55.42,-13.021 -102.685,-68.408 -126.318,-144.971c-23.633,-76.546 -23.633,-174.284 -8.968,-239.437c14.681,-65.153 44.01,-97.738 98.616,-118.913c54.59,-21.175 134.456,-30.941 205.371,-19.548c70.898,11.409 132.829,43.978 197.2,98.551c64.388,54.574 131.217,131.12 227.392,180.81c32.79,16.939 68.991,30.753 108.118,41.669c75.616,21.095 162.164,31.363 256.155,32.436c142.611,1.628 302.344,-17.92 457.194,-54.574c154.834,-36.637 304.785,-90.397 411.54,-139.258c106.771,-48.861 170.329,-92.838 143.441,-124.609c-26.904,-31.771 -144.238,-51.318 -371.631,-69.238c-227.36,-17.904 -564.746,-34.196 -814.941,-30.941c-250.195,3.255 -413.183,26.058 -482.454,51.318c-69.271,25.244 -44.824,52.93 -26.888,111.572c17.92,58.626 29.329,148.226 26.074,227.23c-3.255,78.988 -21.191,147.412 -15.479,184.879c5.697,37.451 35.042,43.978 103.499,48.861c68.441,4.883 176.009,8.138 192.318,-13.851c16.309,-21.989 -58.675,-69.222 -120.605,-96.094c-61.93,-26.888 -110.824,-33.398 -111.654,-13.037c-0.814,20.361 46.452,67.594 117.35,92.025c70.898,24.43 165.446,26.074 275.456,30.143c110.026,4.069 235.53,10.596 352.864,23.617c117.366,13.021 226.579,32.568 335.775,47.233c109.196,14.665 218.408,24.447 248.551,12.223c30.159,-12.223 -18.734,-46.436 -98.6,-84.7c-79.866,-38.281 -190.706,-80.631 -244.482,-85.531c-53.792,-4.883 -50.537,27.702 -24.447,62.728c26.074,35.026 74.967,72.477 163.802,93.652c88.835,21.175 217.578,26.074 303.971,33.398c86.393,7.324 130.404,17.106 133.659,-10.596c3.255,-27.686 -34.228,-92.838 -39.941,-175.098c-5.713,-82.259 20.378,-181.624 -16.292,-206.868c-36.67,-25.244 -136.1,23.617 -326.806,72.493c-190.69,48.861 -472.656,97.721 -661.735,122.982c-189.062,25.244 -285.237,26.855 -249.381,24.43c35.872,-2.458 203.743,-8.968 391.178,-8.968c187.451,0 394.433,6.51 546.842,30.127c152.393,23.617 250.179,64.355 318.636,111.588c68.457,47.233 107.585,100.993 145.882,145.784c38.314,44.792 75.781,80.631 145.882,98.551c70.085,17.92 172.77,17.92 246.907,-44.792c74.186,-62.728 119.824,-188.151 127.148,-304.606c7.357,-116.471 -23.633,-223.974 -76.595,-299.707c-52.978,-75.749 -127.962,-119.726 -208.642,-137.646c-80.68,-17.92 -167.057,-9.766 -229.818,43.978c-62.744,53.76 -101.855,153.109 -110.824,248.405c-8.968,95.28 12.223,186.507 22.819,214.193c10.596,27.702 10.596,-8.138 21.191,-26.058c10.596,-17.92 31.771,-17.92 42.367,-68.424c10.596,-50.488 10.596,-151.465 50.537,-216.634c39.925,-65.153 119.792,-94.466 198.031,-71.663c78.239,22.803 154.834,97.721 180.094,191.39c25.26,93.669 -0.814,206.055 -33.382,279.362c-32.617,73.291 -71.745,107.487 -129.606,110.758c-57.845,3.255 -134.456,-24.43 -184.18,-70.052c-49.707,-45.605 -72.526,-109.131 -76.595,-177.539c-4.069,-68.408 10.596,-141.715 38.298,-155.566c27.702,-13.851 68.457,31.771 118.164,61.898c49.723,30.143 108.382,44.792 127.946,38.281c19.564,-6.51 0.016,-34.212 -9.782,-9.782c-9.782,24.447 -9.782,101.009 6.527,172.672c16.309,71.68 48.909,138.46 74.984,175.911c26.058,37.467 45.638,45.622 88.005,45.622c42.383,0 107.585,-8.154 158.089,-41.536c50.553,-33.398 86.393,-92.041 88.835,-114.03c2.474,-21.989 -28.516,-7.324 -49.707,-12.207c-21.175,-4.899 -32.585,-29.329 -41.553,-111.588c-8.968,-82.259 -15.511,-222.331 -60.303,-320.882c-44.84,-98.551 -127.946,-155.566 -114.095,-173.47c13.851,-17.92 124.674,3.239 192.318,79.801c67.643,76.562 92.09,208.496 97.786,300.537c5.729,92.025 -7.324,144.157 -0.814,156.364c6.543,12.223 32.617,-15.462 88.005,-28.499c55.436,-13.037 140.185,-11.409 237.158,-76.562c97.005,-65.153 206.201,-197.086 301.546,-284.228c95.361,-87.158 176.839,-129.508 288.476,-158.008c111.686,-28.499 253.467,-43.164 334.147,-19.548c80.697,23.617 100.228,85.514 105.957,142.529c5.697,57.015 -2.458,109.131 -3.255,153.109c-0.846,43.978 5.697,79.818 17.904,72.493c12.24,-7.34 30.176,-57.829 3.271,-81.445c-26.904,-23.617 -98.616,-20.361 -273.828,23.617c-175.212,43.978 -453.939,128.678 -616.097,194.645c-162.191,65.967 -207.829,113.216 -262.418,135.205c-54.606,21.989 -118.18,18.734 -85.563,23.617c32.585,4.883 161.344,17.92 246.11,13.021c84.766,-4.883 125.504,-27.686 162.972,-69.222c37.5,-41.536 71.745,-101.807 92.936,-119.71c21.175,-17.92 29.313,6.51 13.835,46.403c-15.479,39.925 -54.59,95.296 -50.521,86.344c4.069,-8.952 51.335,-82.259 98.616,-131.95c47.266,-49.674 94.531,-75.732 105.111,-56.185c10.612,19.548 -15.479,84.7 -39.128,119.71c-23.633,35.026 -44.792,39.925 -21.973,7.34c22.819,-32.585 89.632,-102.62 132.015,-137.646c42.383,-35.01 60.286,-35.01 52.962,-1.611c-7.324,33.382 -39.941,100.163 -57.861,117.269c-17.92,17.106 -21.175,-15.479 18.734,-60.27c39.941,-44.792 123.063,-101.807 155.664,-101.807c32.601,0 14.665,57.015 -10.579,96.924c-25.26,39.909 -57.878,62.712 -47.266,35.026c10.579,-27.702 64.372,-105.892 105.941,-145.801c41.536,-39.893 70.898,-41.52 75.781,-13.021c4.883,28.499 -14.648,87.142 -38.314,117.269c-23.633,30.143 -51.335,31.771 -38.281,-5.697c13.021,-37.467 66.829,-114.014 109.212,-140.902c42.367,-26.872 73.324,-4.069 74.951,39.095c1.628,43.164 -26.074,106.689 -39.925,121.354c-13.851,14.665 -13.851,-19.548 8.968,-87.956c22.819,-68.408 68.457,-171.029 41.569,-211.751c-26.904,-40.723 -126.318,-19.548 -268.945,17.106c-142.611,36.637 -328.434,88.769 -476.758,109.131c-148.291,20.361 -259.147,8.952 -342.252,-7.34c-83.138,-16.276 -138.558,-37.467 -167.887,-82.259c-29.329,-44.792 -32.617,-113.2 -72.526,-153.109c-39.941,-39.909 -116.553,-51.302 -88.867,-52.116c27.734,-0.814 159.766,8.952 284.456,21.175c124.674,12.207 242.025,26.872 337.37,12.207c95.345,-14.448 168.701,-58.626 242.855,-77.36c74.186,-18.734 149.137,-12.223 243.669,-26.074c94.547,-13.835 208.642,-48.047 279.525,-61.084c70.898,-13.021 98.633,-4.883 114.095,37.467c15.495,42.35 18.75,118.913 23.649,111.588c4.899,-7.34 11.409,-98.551 -22.835,-167.79c-34.212,-69.222 -109.196,-116.455 -127.93,-118.896c-18.75,-2.441 18.734,39.909 17.936,51.302c-0.814,11.409 -39.941,-8.138 -76.628,-23.617c-36.67,-15.479 -70.882,-26.872 -105.941,-28.499c-35.042,-1.628 -70.882,6.51 -73.324,28.499c-2.458,21.989 28.499,57.829 42.367,57.829c13.835,0 10.579,-35.84 -19.564,-55.387c-30.159,-19.548 -87.191,-22.803 -111.637,0.016c-24.479,22.803 -16.309,71.663 6.152,81.396c22.445,9.733 59.18,-19.661 41.243,-43.278c-17.904,-23.617 -90.511,-41.471 -132.519,-33.284c-42.008,8.187 -53.434,42.399 -44.45,75.814c8.984,33.415 38.363,66.048 48.942,54.655c10.612,-11.409 2.409,-66.846 -44.873,-83.968c-47.266,-17.139 -133.659,4.036 -254.28,17.074c-120.589,13.021 -275.439,17.904 -393.62,11.393c-118.164,-6.51 -199.658,-24.43 -252.637,-50.488c-52.978,-26.074 -77.409,-60.27 -79.85,-50.505c-2.441,9.766 17.122,63.525 58.659,107.503c41.553,43.978 105.127,78.19 120.622,84.717c15.495,6.51 -17.122,-14.665 -8.138,-38.281c8.952,-23.617 59.473,-49.691 54.574,-81.445c-4.867,-31.771 -65.186,-69.238 -107.568,-86.344c-42.383,-17.09 -66.829,-13.835 -48.877,-1.628c17.92,12.223 78.239,33.398 160.531,23.633c82.308,-9.782 186.621,-50.505 245.312,-57.829c58.659,-7.34 71.712,18.734 61.1,39.095c-10.579,20.361 -44.824,35.01 -36.654,45.605c8.138,10.579 58.659,17.106 93.717,13.851c35.042,-3.271 54.606,-16.292 76.579,-34.212c22.038,-17.92 46.484,-40.723 62.76,-66.781c16.309,-26.074 24.479,-55.387 78.255,-73.307c53.792,-17.92 153.206,-24.43 219.222,-28.499c65.999,-4.085 98.616,-5.697 109.196,8.138c10.612,13.851 -0.814,43.164 -15.495,69.238c-14.648,26.058 -32.585,48.861 -9.098,59.44c23.519,10.596 88.444,8.968 128.369,-20.361c39.925,-29.313 54.883,-86.328 79.46,-123.779c24.593,-37.467 58.789,-55.387 75.098,-52.132c16.309,3.255 14.681,27.686 -3.255,40.723c-17.92,13.037 -52.132,14.648 -43.994,18.734c8.138,4.069 58.675,10.579 95.329,-11.409c36.686,-21.989 59.505,-72.477 60.319,-109.131c0.814,-36.654 -20.378,-59.456 -76.628,-55.387c-56.201,4.085 -147.477,35.026 -217.578,58.643c-70.085,23.617 -118.978,39.909 -156.478,59.456c-37.467,19.548 -63.558,42.35 -92.074,53.743c-28.516,11.409 -59.505,11.409 -56.25,-8.138c3.288,-19.548 40.755,-58.643 16.309,-65.153c-24.447,-6.51 -110.824,19.548 -223.568,50.635c-112.744,31.087 -251.807,67.187 -345.54,97.331c-93.717,30.127 -142.074,54.281 -220.85,48.454c-78.792,-5.843 -187.988,-41.683 -384.375,-49.805c-196.403,-8.154 -480.013,11.393 -666.634,40.706c-186.621,29.313 -276.269,68.408 -329.248,119.726c-52.962,51.302 -69.255,114.827 -79.394,192.106c-10.124,77.262 -14.079,168.245 -53.385,232.064c-39.323,63.818 -114.014,100.439 -188.704,137.077" style={{fill:"none",fillRule:"nonzero",stroke:darkMode ? "#FFFFFF" : "#021011",strokeWidth:"14.65px"}}/>
      </g>
    </g>
  </svg>
);

// ─── Indicador de fuerza de contraseña ───────────────────────────────────────
const PasswordStrength = ({ password, darkMode }) => {
  const checks = [
    { label: "8+ caracteres",        ok: password.length >= 8 },
    { label: "Letra mayúscula",       ok: /[A-Z]/.test(password) },
    { label: "Letra minúscula",       ok: /[a-z]/.test(password) },
    { label: "Número o símbolo",      ok: /[\d\W]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const bars  = [
    "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500"
  ];
  const label = ["Muy débil", "Débil", "Regular", "Fuerte"];

  if (!password) return null;

  return (
    <div className="flex flex-col gap-2 mt-1">
      <div className="flex gap-1">
        {[0,1,2,3].map((i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-all duration-300 ${i < score ? bars[score - 1] : darkMode ? "bg-zinc-700" : "bg-gray-200"}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className={`text-[10px] ${darkMode ? "text-zinc-500" : "text-gray-400"}`}>
          {label[score - 1] || "Muy débil"}
        </p>
        <div className="flex gap-3">
          {checks.map((c, i) => (
            <span key={i} className={`text-[10px] transition-colors flex items-center gap-1 ${c.ok ? "text-emerald-500" : darkMode ? "text-zinc-600" : "text-gray-300"}`}>
              {c.ok ? <Icon name="check" className="w-2.5 h-2.5" /> : <Icon name="circle" className="w-2.5 h-2.5" />} {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Pantalla de éxito ────────────────────────────────────────────────────────
const SuccessScreen = ({ darkMode }) => (
  <div className="flex flex-col items-center gap-4 py-4 text-center">
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center"
      style={{ backgroundColor: "rgba(96,174,187,0.12)", border: "1.5px solid rgba(96,174,187,0.3)" }}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#60aebb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
    <div>
      <h2 className={`text-lg font-semibold mb-1 ${darkMode ? "text-zinc-100" : "text-gray-800"}`}>
        ¡Contraseña actualizada!
      </h2>
      <p className={`text-sm ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
        Tu contraseña ha sido cambiada. Redirigiendo al inicio de sesión...
      </p>
    </div>
    <div className="w-5 h-5 rounded-full border-2 border-zinc-800 animate-spin" style={{ borderTopColor: "#60aebb" }} />
  </div>
);

export default function CambiarContrasena() {
  const navigate = useNavigate();

  const [phase,        setPhase]        = useState("loading"); // loading | form | success | error
  const [password,     setPassword]     = useState("");
  const [confirm,      setConfirm]      = useState("");
  const [showPass,     setShowPass]     = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
  const [darkMode]  = useState(prefersDark);

  // ── Verificar la recuperación en la URL o sesión ───────────────────────────
  useEffect(() => {
    const init = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace("#", ""));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type"); // recovery

      if (accessToken && type === "recovery") {
        // Establecer la sesión para cambiar la contraseña
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error || !data.session) {
          setPhase("error");
          return;
        }

        setSessionReady(true);
        setPhase("form");

        // Limpiar el hash de la URL
        window.history.replaceState(null, "", window.location.pathname);
        return;
      }

      // Si no hay params checkear sesion
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSessionReady(true);
        setPhase("form");
      } else {
        setPhase("error");
      }
    };

    init();
  }, []);

  const handleSubmit = async () => {
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres."); return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden."); return;
    }

    setSaving(true);

    const { error: passError } = await supabase.auth.updateUser({ password });
    if (passError) {
      setError("No se pudo actualizar la contraseña. Intenta de nuevo.");
      setSaving(false); return;
    }

    // Cerrar sesión después de cambiar la contraseña por seguridad
    await supabase.auth.signOut();

    setPhase("success");
    setTimeout(() => navigate("/login", { replace: true }), 2200);
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  const bg    = darkMode ? "bg-[#18181f]"                         : "bg-gray-100";
  const card  = darkMode ? "bg-[#1e1e27] border-zinc-800"         : "bg-white border-gray-200";
  const label = darkMode ? "text-zinc-500"                        : "text-gray-400";
  const inputBase = darkMode
    ? "border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:border-[#60aebb]"
    : "border-gray-300 text-gray-800 placeholder-gray-400 focus:border-[#60aebb]";

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${bg} transition-colors duration-300`}>
      <div
        className={`w-full max-w-sm mx-4 rounded-xl border ${card} p-8 flex flex-col`}
        style={{
          boxShadow: darkMode ? "0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.04) inset" : "0 4px 24px rgba(0,0,0,0.10)",
          minHeight: "420px"
        }}
      >
        <div className="flex flex-col items-center gap-1 mb-8">
          <Logo className="w-44 h-auto" darkMode={darkMode} />
        </div>

        <div className="flex-1 flex flex-col justify-center">
          {phase === "loading" && (
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-zinc-800 animate-spin" style={{ borderTopColor: "#60aebb" }} />
              <p className={`text-sm ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>Validando enlace de recuperación...</p>
            </div>
          )}

          {phase === "error" && (
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(219,60,28,0.1)", border: "1px solid rgba(219,60,28,0.2)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#db3c1c" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div>
                <h3 className={`font-semibold ${darkMode ? "text-zinc-200" : "text-gray-800"}`}>Enlace inválido o expirado</h3>
                <p className={`text-xs mt-1 leading-relaxed ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
                  El enlace para recuperar contraseña ya no es válido. Haz clic en "¿Olvidaste tu contraseña?" nuevamente en la página de inicio.
                </p>
              </div>
              <button
                onClick={() => navigate("/login", { replace: true })}
                className="mt-2 text-sm font-medium hover:underline" style={{ color: "#60aebb" }}
              >
                Volver al inicio
              </button>
            </div>
          )}

          {phase === "success" && <SuccessScreen darkMode={darkMode} />}

          {phase === "form" && sessionReady && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="text-center">
                <h2 className={`text-lg font-semibold ${darkMode ? "text-zinc-100" : "text-gray-800"}`}>
                  Nueva contraseña
                </h2>
                <p className={`text-xs mt-1 ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
                  Crea una contraseña segura para tu cuenta.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 relative">
                  <label className={`text-[10px] font-semibold uppercase tracking-widest ${label}`}>
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Input
                      type={showPass ? "text" : "password"}
                      value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKey}
                      placeholder="••••••••"
                      darkMode={darkMode}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className={`absolute right-3 top-2.5 text-xs font-semibold ${darkMode ? "text-zinc-500 hover:text-zinc-300" : "text-gray-400 hover:text-gray-600"}`}
                    >
                      {showPass ? "OCULTAR" : "VER"}
                    </button>
                  </div>
                  {password && <PasswordStrength password={password} darkMode={darkMode} />}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={`text-[10px] font-semibold uppercase tracking-widest ${label}`}>
                    Confirmar Contraseña
                  </label>
                  <Input
                    type="password"
                    value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={handleKey}
                    placeholder="••••••••"
                    darkMode={darkMode}
                  />
                </div>
              </div>

              {error && <p className="text-xs text-center" style={{ color: "#db3c1c" }}>{error}</p>}

              <Button
                onClick={handleSubmit} disabled={saving}
                variant="destructive"
                className="w-full py-2.5 shadow-[0_2px_10px_rgba(219,60,28,0.25)] hover:opacity-90 transition-all"
              >
                {saving ? "Guardando..." : "Actualizar Contraseña"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}