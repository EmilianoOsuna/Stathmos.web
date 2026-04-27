import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import useSupabaseRealtime from "./hooks/useSupabaseRealtime";
import { createPortal } from "react-dom";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import supabase from "./supabase";
import Login from "./Login";
import CompletarRegistro from "./CompletarRegistro";
import CambiarContrasena from "./CambiarContrasena";
import TicketWrapper from "./components/TicketWrapper";
import HistorialTicketsWrapper from "./components/HistorialTicketsWrapper";
import HistorialServiciosAdminWrapper from "./components/HistorialServiciosAdminWrapper";
import MecanicoDiagnosticosModule from "./components/MecanicoDiagnosticosModule";
import ReportesOperativosWrapper from "./components/ReportesOperativosWrapper";
import CitasModule from "./components/CitasModule";
import GestionInventario from "./components/GestionInventario";
import HistorialRefacciones from "./components/HistorialRefacciones";
import HistorialesModule from "./components/HistorialesModule";
import CentroReportes from "./components/CentroReportes";
import { loadStripe } from '@stripe/stripe-js';
import { formatDateWorkshop, formatDateTimeWorkshop, todayWorkshopYmd } from "./utils/datetime";
import { Card, Select, Input, Field, Textarea, ModuleHeader, Button, Modal, Icon as LucideIcon, DatePicker } from "./components/UIPrimitives";

// ─── Accent tokens ─────────────────────────────────────────────────────────────
const C_BLUE = "#60aebb";
const C_RED  = "#db3c1c";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ─── Text Normalization (SAT Compliance) ──────────────────────────────────────
const normalizeForSAT = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remueve acentos
    .toUpperCase()
    .trim();
};

const normalizeUI = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
};

// ─── Validation Helpers ──────────────────────────────────────────────────────
const isValidEmail = (email) => {
  if (!email || !email.trim()) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toLowerCase());
};

const isValidRFC = (rfc) => {
  if (!rfc || !rfc.trim()) return false;
  const rfcRegex = /^[A-ZÑ]{3,4}\d{6}[A-Z0-9]{2}[0-9A]?$/;
  return rfcRegex.test(rfc.toUpperCase());
};

const isValidVIN = (vin) => {
  if (!vin || !vin.trim()) return true; // VIN es opcional
  const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
  return vinRegex.test(vin.trim());
};

const isValidPhone = (tel) => {
  const clean = String(tel || "").replace(/\D/g, "");
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(clean);
};

// ─── Logo ─────────────────────────────
const LogoMark = ({ className = "h-6 w-auto", darkMode }) => (
  <svg className={className} viewBox="0 0 6000 3375" xmlns="http://www.w3.org/2000/svg"
    style={{ fillRule:"evenodd", clipRule:"evenodd", strokeLinecap:"round", strokeLinejoin:"round", strokeMiterlimit:"22.926" }}
  >
    <path d="M1577.067,1787.012c-41.243,48.193 -29.069,158.236 92.22,221.712c121.305,63.46 351.725,80.355 582.682,73.161c230.957,-7.178 462.419,-38.444 626.383,-135.352c163.981,-96.891 260.465,-259.424 230.111,-306.413c-30.339,-46.973 -187.533,21.598 -425.472,61.865c-237.939,40.251 -556.657,52.181 -763.33,51.318c-206.689,-0.846 -301.351,-14.486 -342.594,33.708" style={{fill:"#db3c1c"}}/>
    <path d="M3876.888,1411.263c-87.044,-27.832 -283.398,-79.297 -556.299,-56.999c-272.917,22.298 -622.428,118.359 -967.546,176.042c-345.117,57.682 -685.856,77.002 -787.549,113.737c-101.709,36.719 35.645,90.853 242.139,122.054c206.494,31.201 482.145,39.469 786.768,-5.99c304.59,-45.459 638.151,-144.629 863.818,-205.697c225.684,-61.051 343.506,-84.001 413.509,-97.575c70.003,-13.558 92.22,-17.757 5.16,-45.573" style={{fill:"#60aebb"}}/>
    <g>
      <clipPath id="lm1"><rect x="713.021" y="858.333" width="4574.479" height="1654.167"/></clipPath>
      <g clipPath="url(#lm1)">
        <path d="M4795.652,1205.209c-90.706,-21.338 -181.413,-42.676 -279.736,-54.167c-98.34,-11.475 -204.281,-13.102 -262.939,-5.778c-58.691,7.324 -70.117,23.617 -39.469,44.01c30.68,20.378 103.402,44.857 130.29,50.553c26.888,5.713 7.975,-7.373 -137.614,-61.963c-145.54,-54.59 -417.757,-150.683 -619.856,-213.395c-202.1,-62.712 -334.131,-92.041 -519.108,-96.11c-184.993,-4.069 -422.965,17.106 -617.741,61.084c-194.775,43.978 -346.354,110.758 -477.555,191.39c-131.217,80.631 -242.041,175.098 -227.376,164.518c14.665,-10.596 154.834,-126.237 337.386,-182.438c182.552,-56.201 407.471,-52.93 594.922,-18.734c187.435,34.212 337.386,99.365 445.768,137.646c108.398,38.281 175.212,49.674 274.642,58.643c99.43,8.952 231.445,15.462 350.407,34.196c119.01,18.734 224.951,49.691 251.025,47.233c26.074,-2.425 -27.702,-38.265 -184.163,-65.967c-156.494,-27.686 -415.641,-47.233 -726.123,-32.568c-310.498,14.665 -672.347,63.525 -916.015,92.838c-243.669,29.329 -369.173,39.095 -469.417,39.095c-100.228,0 -175.212,-9.766 -205.355,-31.755c-30.159,-21.989 -15.495,-56.201 25.26,-79.818c40.739,-23.617 107.568,-36.654 135.27,-27.686c27.718,8.952 16.309,39.893 0,66.781c-16.292,26.872 -37.484,49.674 -61.93,52.116c-24.447,2.441 -52.165,-15.462 -57.047,-35.84c-4.883,-20.361 13.037,-43.164 39.111,-60.254c26.09,-17.106 60.319,-28.516 52.978,-11.409c-7.34,17.106 -56.234,62.712 -132.845,91.211c-76.595,28.516 -180.908,39.909 -268.929,48.063c-88.005,8.138 -159.733,13.021 -193.148,26.058c-33.398,13.037 -28.516,34.212 -13.851,41.536c14.681,7.324 39.128,0.814 59.505,-12.223c20.361,-13.037 36.67,-32.568 15.479,-34.196c-21.191,-1.628 -79.866,14.648 -126.318,36.654c-46.452,21.973 -80.68,49.674 -108.398,118.896c-27.702,69.222 -48.893,179.997 -66.829,257.373c-17.92,77.36 -32.585,121.338 -31.771,147.396c0.814,26.074 17.106,34.212 12.223,48.063c-4.883,13.835 -30.973,33.382 -46.452,35.01c-15.479,1.628 -20.378,-14.648 8.968,-11.393c29.329,3.255 92.904,26.058 136.084,38.281c43.197,12.207 66.016,13.835 70.898,-6.51c4.899,-20.361 -8.138,-62.728 -27.702,-82.259c-19.548,-19.548 -45.638,-16.309 -69.255,-16.309c-23.633,0 -44.824,-3.239 -43.197,-21.973c1.628,-18.734 26.074,-52.946 52.962,-60.27c26.888,-7.324 56.234,12.207 52.148,14.648c-4.069,2.458 -41.553,-12.207 -57.845,-47.233c-16.309,-35.026 -11.409,-90.397 6.51,-136.816c17.936,-46.419 48.909,-83.887 65.202,-93.669c16.292,-9.766 17.936,8.154 10.596,43.978c-7.34,35.84 -23.633,89.6 -32.601,130.322c-8.968,40.706 -10.596,68.408 -6.527,35.01c4.069,-33.382 13.867,-127.864 41.569,-195.459c27.702,-67.594 73.34,-108.333 132.015,-126.237c58.691,-17.92 130.404,-13.037 193.978,22.803c63.558,35.84 118.978,102.62 145.866,192.204c26.888,89.583 25.26,201.986 16.292,281.803c-8.952,79.801 -25.26,127.034 -68.441,161.247c-43.197,34.212 -113.281,55.387 -175.228,49.691c-61.93,-5.697 -115.723,-38.281 -156.478,-107.519c-40.739,-69.222 -68.441,-175.098 -68.441,-268.75c0,-93.669 27.702,-175.114 64.372,-223.161c36.686,-48.047 82.324,-62.712 110.026,-68.408c27.702,-5.697 37.484,-2.458 30.143,11.393c-7.324,13.851 -31.787,38.281 -30.143,81.445c1.628,43.164 29.329,105.062 34.228,102.62c4.883,-2.441 -13.037,-69.222 -4.085,-104.248c8.968,-35.01 44.824,-38.281 82.324,-5.697c37.484,32.585 76.595,100.993 92.887,180.81c16.309,79.801 9.798,171.029 -25.244,231.299c-35.042,60.27 -98.616,89.583 -154.036,76.546c-55.42,-13.021 -102.685,-68.408 -126.318,-144.971c-23.633,-76.546 -23.633,-174.284 -8.968,-239.437c14.681,-65.153 44.01,-97.738 98.616,-118.913c54.59,-21.175 134.456,-30.941 205.371,-19.548c70.898,11.409 132.829,43.978 197.2,98.551c64.388,54.574 131.217,131.12 227.392,180.81c32.79,16.939 68.991,30.753 108.118,41.669c75.616,21.095 162.164,31.363 256.155,32.436c142.611,1.628 302.344,-17.92 457.194,-54.574c154.834,-36.637 304.785,-90.397 411.54,-139.258c106.771,-48.861 170.329,-92.838 143.441,-124.609c-26.904,-31.771 -144.238,-51.318 -371.631,-69.238c-227.36,-17.904 -564.746,-34.196 -814.941,-30.941c-250.195,3.255 -413.183,26.058 -482.454,51.318c-69.271,25.244 -44.824,52.93 -26.888,111.572c17.92,58.626 29.329,148.226 26.074,227.23c-3.255,78.988 -21.191,147.412 -15.479,184.879c5.697,37.451 35.042,43.978 103.499,48.861c68.441,4.883 176.009,8.138 192.318,-13.851c16.309,-21.989 -58.675,-69.222 -120.605,-96.094c-61.93,-26.888 -110.824,-33.398 -111.654,-13.037c-0.814,20.361 46.452,67.594 117.35,92.025c70.898,24.43 165.446,26.074 275.456,30.143c110.026,4.069 235.53,10.596 352.864,23.617c117.366,13.021 226.579,32.568 335.775,47.233c109.196,14.665 218.408,24.447 248.551,12.223c30.159,-12.223 -18.734,-46.436 -98.6,-84.7c-79.866,-38.281 -190.706,-80.631 -244.482,-85.531c-53.792,-4.883 -50.537,27.702 -24.447,62.728c26.074,35.026 74.967,72.477 163.802,93.652c88.835,21.175 217.578,26.074 303.971,33.398c86.393,7.324 130.404,17.106 133.659,-10.596c3.255,-27.686 -34.228,-92.838 -39.941,-175.098c-5.713,-82.259 20.378,-181.624 -16.292,-206.868c-36.67,-25.244 -136.1,23.617 -326.806,72.493c-190.69,48.861 -472.656,97.721 -661.735,122.982c-189.062,25.244 -285.237,26.855 -249.381,24.43c35.872,-2.458 203.743,-8.968 391.178,-8.968c187.451,0 394.433,6.51 546.842,30.127c152.393,23.617 250.179,64.355 318.636,111.588c68.457,47.233 107.585,100.993 145.882,145.784c38.314,44.792 75.781,80.631 145.882,98.551c70.085,17.92 172.77,17.92 246.907,-44.792c74.186,-62.728 119.824,-188.151 127.148,-304.606c7.357,-116.471 -23.633,-223.974 -76.595,-299.707c-52.978,-75.749 -127.962,-119.726 -208.642,-137.646c-80.68,-17.92 -167.057,-9.766 -229.818,43.978c-62.744,53.76 -101.855,153.109 -110.824,248.405c-8.968,95.28 12.223,186.507 22.819,214.193c10.596,27.702 10.596,-8.138 21.191,-26.058c10.596,-17.92 31.771,-17.92 42.367,-68.424c10.596,-50.488 10.596,-151.465 50.537,-216.634c39.925,-65.153 119.792,-94.466 198.031,-71.663c78.239,22.803 154.834,97.721 180.094,191.39c25.26,93.669 -0.814,206.055 -33.382,279.362c-32.617,73.291 -71.745,107.487 -129.606,110.758c-57.845,3.255 -134.456,-24.43 -184.18,-70.052c-49.707,-45.605 -72.526,-109.131 -76.595,-177.539c-4.069,-68.408 10.596,-141.715 38.298,-155.566c27.702,-13.851 68.457,31.771 118.164,61.898c49.723,30.143 108.382,44.792 127.946,38.281c19.564,-6.51 0.016,-34.212 -9.782,-9.782c-9.782,24.447 -9.782,101.009 6.527,172.672c16.309,71.68 48.909,138.46 74.984,175.911c26.058,37.467 45.638,45.622 88.005,45.622c42.383,0 107.585,-8.154 158.089,-41.536c50.553,-33.398 86.393,-92.041 88.835,-114.03c2.474,-21.989 -28.516,-7.324 -49.707,-12.207c-21.175,-4.899 -32.585,-29.329 -41.553,-111.588c-8.968,-82.259 -15.511,-222.331 -60.303,-320.882c-44.84,-98.551 -127.946,-155.566 -114.095,-173.47c13.851,-17.92 124.674,3.239 192.318,79.801c67.643,76.562 92.09,208.496 97.786,300.537c5.729,92.025 -7.324,144.157 -0.814,156.364c6.543,12.223 32.617,-15.462 88.005,-28.499c55.436,-13.037 140.185,-11.409 237.158,-76.562c97.005,-65.153 206.201,-197.086 301.546,-284.228c95.361,-87.158 176.839,-129.508 288.476,-158.008c111.686,-28.499 253.467,-43.164 334.147,-19.548c80.697,23.617 100.228,85.514 105.957,142.529c5.697,57.015 -2.458,109.131 -3.255,153.109c-0.846,43.978 5.697,79.818 17.904,72.493c12.24,-7.34 30.176,-57.829 3.271,-81.445c-26.904,-23.617 -98.616,-20.361 -273.828,23.617c-175.212,43.978 -453.939,128.678 -616.097,194.645c-162.191,65.967 -207.829,113.216 -262.418,135.205c-54.606,21.989 -118.18,18.734 -85.563,23.617c32.585,4.883 161.344,17.92 246.11,13.021c84.766,-4.883 125.504,-27.686 162.972,-69.222c37.5,-41.536 71.745,-101.807 92.936,-119.71c21.175,-17.92 29.313,6.51 13.835,46.403c-15.479,39.925 -54.59,95.296 -50.521,86.344c4.069,-8.952 51.335,-82.259 98.616,-131.95c47.266,-49.674 94.531,-75.732 105.111,-56.185c10.612,19.548 -15.479,84.7 -39.128,119.71c-23.633,35.026 -44.792,39.925 -21.973,7.34c22.819,-32.585 89.632,-102.62 132.015,-137.646c42.383,-35.01 60.286,-35.01 52.962,-1.611c-7.324,33.382 -39.941,100.163 -57.861,117.269c-17.92,17.106 -21.175,-15.479 18.734,-60.27c39.941,-44.792 123.063,-101.807 155.664,-101.807c32.601,0 14.665,57.015 -10.579,96.924c-25.26,39.909 -57.878,62.712 -47.266,35.026c10.579,-27.702 64.372,-105.892 105.941,-145.801c41.536,-39.893 70.898,-41.52 75.781,-13.021c4.883,28.499 -14.648,87.142 -38.314,117.269c-23.633,30.143 -51.335,31.771 -38.281,-5.697c13.021,-37.467 66.829,-114.014 109.212,-140.902c42.367,-26.872 73.324,-4.069 74.951,39.095c1.628,43.164 -26.074,106.689 -39.925,121.354c-13.851,14.665 -13.851,-19.548 8.968,-87.956c22.819,-68.408 68.457,-171.029 41.569,-211.751c-26.904,-40.723 -126.318,-19.548 -268.945,17.106c-142.611,36.637 -328.434,88.769 -476.758,109.131c-148.291,20.361 -259.147,8.952 -342.252,-7.34c-83.138,-16.276 -138.558,-37.467 -167.887,-82.259c-29.329,-44.792 -32.617,-113.2 -72.526,-153.109c-39.941,-39.909 -116.553,-51.302 -88.867,-52.116c27.734,-0.814 159.766,8.952 284.456,21.175c124.674,12.207 242.025,26.872 337.37,12.207c95.345,-14.648 168.701,-58.626 242.855,-77.36c74.186,-18.734 149.137,-12.223 243.669,-26.074c94.547,-13.835 208.642,-48.047 279.525,-61.084c70.898,-13.021 98.633,-4.883 114.095,37.467c15.495,42.35 18.75,118.913 23.649,111.588c4.899,-7.34 11.409,-98.551 -22.835,-167.79c-34.212,-69.222 -109.196,-116.455 -127.93,-118.896c-18.75,-2.441 18.734,39.909 17.936,51.302c-0.814,11.409 -39.941,-8.138 -76.628,-23.617c-36.67,-15.479 -70.882,-26.872 -105.941,-28.499c-35.042,-1.628 -70.882,6.51 -73.324,28.499c-2.458,21.989 28.499,57.829 42.367,57.829c13.835,0 10.579,-35.84 -19.564,-55.387c-30.159,-19.548 -87.191,-22.803 -111.637,0.016c-24.479,22.803 -16.309,71.663 6.152,81.396c22.445,9.733 59.18,-19.661 41.243,-43.278c-17.904,-23.617 -90.511,-41.471 -132.519,-33.284c-42.008,8.187 -53.434,42.399 -44.45,75.814c8.984,33.415 38.363,66.048 48.942,54.655c10.612,-11.409 2.409,-66.846 -44.873,-83.968c-47.266,-17.139 -133.659,4.036 -254.28,17.074c-120.589,13.021 -275.439,17.904 -393.62,11.393c-118.164,-6.51 -199.658,-24.43 -252.637,-50.488c-52.978,-26.074 -77.409,-60.27 -79.85,-50.505c-2.441,9.766 17.122,63.525 58.659,107.503c41.553,43.978 105.127,78.19 120.622,84.717c15.495,6.51 -17.122,-14.665 -8.138,-38.281c8.952,-23.617 59.473,-49.691 54.574,-81.445c-4.867,-31.771 -65.186,-69.238 -107.568,-86.344c-42.383,-17.09 -66.829,-13.835 -48.877,-1.628c17.92,12.223 78.239,33.398 160.531,23.633c82.308,-9.782 186.621,-50.505 245.312,-57.829c58.659,-7.34 71.712,18.734 61.1,39.095c-10.579,20.361 -44.824,35.01 -36.654,45.605c8.138,10.579 58.659,17.106 93.717,13.851c35.042,-3.271 54.606,-16.292 76.579,-34.212c22.038,-17.92 46.484,-40.723 62.76,-66.781c16.309,-26.074 24.479,-55.387 78.255,-73.307c53.792,-17.92 153.206,-24.43 219.222,-28.499c65.999,-4.085 98.616,-5.697 109.196,8.138c10.612,13.851 -0.814,43.164 -15.495,69.238c-14.648,26.058 -32.585,48.861 -9.098,59.44c23.519,10.596 88.444,8.968 128.369,-20.361c39.925,-29.313 54.883,-86.328 79.46,-123.779c24.593,-37.467 58.789,-55.387 75.098,-52.132c16.309,3.255 14.681,27.686 -3.255,40.723c-17.92,13.037 -52.132,14.648 -43.994,18.734c8.138,4.069 58.675,10.579 95.329,-11.409c36.686,-21.989 59.505,-72.477 60.319,-109.131c0.814,-36.654 -20.378,-59.456 -76.628,-55.387c-56.201,4.085 -147.477,35.026 -217.578,58.643c-70.085,23.617 -118.978,39.909 -156.478,59.456c-37.467,19.548 -63.558,42.35 -92.074,53.743c-28.516,11.409 -59.505,11.409 -56.25,-8.138c3.288,-19.548 40.755,-58.643 16.309,-65.153c-24.447,-6.51 -110.824,19.548 -223.568,50.635c-112.744,31.087 -251.807,67.187 -345.54,97.331c-93.717,30.127 -142.074,54.281 -220.85,48.454c-78.792,-5.843 -187.988,-41.683 -384.375,-49.805c-196.403,-8.154 -480.013,11.393 -666.634,40.706c-186.621,29.313 -276.269,68.408 -329.248,119.726c-52.962,51.302 -69.255,114.827 -79.394,192.106c-10.124,77.262 -14.079,168.245 -53.385,232.064c-39.323,63.818 -114.014,100.439 -188.704,137.077" style={{fill:"none",fillRule:"nonzero",stroke:darkMode ? "#FFFFFF" : "#021011",strokeWidth:"14.65px"}}/>
      </g>
    </g>
  </svg>
);


// ─── Constants ────────────────────────────────────────────────────────────────
const ESTADOS_PROYECTO = [
  "pendiente_diagnostico",
  "pendiente_cotizacion",
  "pendiente_aprobacion",
  "en_progreso",
  "pendiente_refaccion",
  "terminado",
  "entregado",
  "no_aprobado",
  "cancelado",
  "activo",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const estadoBadge = (estado, darkMode) => {
  const dark = {
    activo:                "bg-sky-900/50 text-sky-300 border-sky-800",
    pendiente_diagnostico: "bg-red-900/50 text-red-300 border-red-800",
    pendiente_cotizacion:  "bg-amber-900/50 text-amber-300 border-amber-800",
    pendiente_aprobacion:  "bg-orange-900/50 text-orange-300 border-orange-800",
    en_progreso:           "bg-blue-900/50 text-blue-300 border-blue-800",
    pendiente_refaccion:   "bg-purple-900/50 text-purple-300 border-purple-800",
    terminado:             "bg-emerald-900/50 text-emerald-300 border-emerald-800",
    entregado:             "bg-teal-900/50 text-teal-300 border-teal-800",
    no_aprobado:           "bg-rose-900/50 text-rose-300 border-rose-800",
    cancelado:             "bg-zinc-800 text-zinc-400 border-zinc-700",
  };
  const light = {
    activo:                "bg-sky-50 text-sky-700 border-sky-200",
    pendiente_diagnostico: "bg-red-50 text-red-700 border-red-200",
    pendiente_cotizacion:  "bg-amber-50 text-amber-700 border-amber-200",
    pendiente_aprobacion:  "bg-orange-50 text-orange-700 border-orange-200",
    en_progreso:           "bg-blue-50 text-blue-700 border-blue-200",
    pendiente_refaccion:   "bg-purple-50 text-purple-700 border-purple-200",
    terminado:             "bg-emerald-50 text-emerald-700 border-emerald-200",
    entregado:             "bg-teal-50 text-teal-700 border-teal-200",
    no_aprobado:           "bg-rose-50 text-rose-700 border-rose-200",
    cancelado:             "bg-gray-100 text-gray-500 border-gray-200",
  };
  const m = darkMode ? dark : light;
  return m[estado] || (darkMode ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-gray-100 text-gray-500 border-gray-200");
};

const fmtDate = (d) => formatDateWorkshop(d, { dateStyle: "medium" });

const ESTADO_LABELS = {
  activo: "Activo",
  pendiente_diagnostico: "Pendiente de diagnóstico",
  pendiente_cotizacion: "Pendiente de cotización",
  pendiente_aprobacion: "Pendiente de aprobación",
  en_progreso: "En progreso",
  pendiente_refaccion: "Pendiente (refacción)",
  terminado: "Terminado",
  entregado: "Entregado",
  no_aprobado: "No aprobado",
  cancelado: "Cancelado",
};

const estadoLabel = (estado) => ESTADO_LABELS[estado] || (estado ? String(estado).replace(/_/g, " ") : "—");

const getLatestCotizacion = (proyecto) => {
  const cotizaciones = Array.isArray(proyecto?.cotizaciones) ? proyecto.cotizaciones : [];
  if (!cotizaciones.length) return null;

  return [...cotizaciones].sort((a, b) => {
    const ad = new Date(a?.created_at || a?.fecha_emision || 0).getTime();
    const bd = new Date(b?.created_at || b?.fecha_emision || 0).getTime();
    return bd - ad;
  })[0];
};

const useUserNotifications = (session) => {
  const userId = session?.user?.id || null;
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("notificaciones")
      .select("id, titulo, mensaje, leida, proyecto_id, created_at")
      .eq("usuario_id", userId)
      .order("created_at", { ascending: false });
    setNotificaciones(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();

    const channel = supabase
      .channel(`notificaciones_channel_${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notificaciones", filter: `usuario_id=eq.${userId}` },
        (payload) => {
          console.log("🔔 Nueva notificación recibida en tiempo real:", payload);
          fetchNotifications();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notificaciones", filter: `usuario_id=eq.${userId}` },
        () => fetchNotifications()
      )
      .subscribe((status) => {
        console.log(`📡 Estado suscripción notificaciones (${userId}):`, status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  const unreadCount = notificaciones.filter((n) => !n.leida).length;

  return { notificaciones, loading, unreadCount, refresh: fetchNotifications };
};

const invokeEdgeFunction = async (name, { body, userToken }) => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${userToken || SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body || {}),
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg = json?.error || json?.message || `Edge Function error (${res.status})`;
    throw new Error(msg);
  }

  return json;
};

// ─── Notification Helpers ──────────────────────────────────────────────────────
const notifyAdminNewAppointment = async ({ citaId, clienteId, clienteNombre, fechaHora, session }) => {
  try {
    let name = clienteNombre;
    if (!name && clienteId) {
      const { data } = await supabase.from("clientes").select("nombre").eq("id", clienteId).maybeSingle();
      name = data?.nombre;
    }
    const finalName = name || "Un cliente";

    const { data: admins } = await supabase.from("usuarios").select("id").eq("rol", "Administrador");
    if (!admins || admins.length === 0) return;

    const titulo = "Nueva cita agendada";
    const mensaje = `${finalName} ha agendado una cita para el ${fechaHora}.`;

    for (const admin of admins) {
      await invokeEdgeFunction("enviar-notificacion", {
        body: { usuario_id: admin.id, cita_id: citaId, titulo, mensaje },
        userToken: session?.access_token || "",
      });
    }
  } catch (err) {
    console.warn("[notifyAdminNewAppointment] error:", err);
  }
};

const notifyAdminPayment = async ({ proyectoId, tituloProyecto, monto, session }) => {
  try {
    const { data: admins } = await supabase.from("usuarios").select("id").eq("rol", "Administrador");
    if (!admins || admins.length === 0) return;

    const titulo = "Pago recibido";
    const mensaje = `Se ha registrado un pago de $${monto} para el proyecto "${tituloProyecto}".`;

    for (const admin of admins) {
      await invokeEdgeFunction("enviar-notificacion", {
        body: { usuario_id: admin.id, proyecto_id: proyectoId, titulo, mensaje },
        userToken: session?.access_token || "",
      });
    }
  } catch (err) {
    console.warn("[notifyAdminPayment] error:", err);
  }
};

const notifyClientStateChange = async ({ proyectoId, clienteId, tituloProyecto, nuevoEstado, session }) => {
  if (!clienteId) return;
  try {
    const { data: cliente } = await supabase
      .from("clientes")
      .select("usuario_id, correo")
      .eq("id", clienteId)
      .maybeSingle();

    let usuarioId = cliente?.usuario_id;
    if (!usuarioId && cliente?.correo) {
      const { data: usuario } = await supabase.from("usuarios").select("id").eq("correo", cliente.correo).maybeSingle();
      usuarioId = usuario?.id;
    }

    if (!usuarioId) return;

    const estadoStr = estadoLabel(nuevoEstado);
    const isFinished = nuevoEstado === "entregado" || nuevoEstado === "terminado";
    const titulo = isFinished ? "Proyecto finalizado" : "Actualización de tu proyecto";
    const mensaje = isFinished
      ? `Tu proyecto "${tituloProyecto}" ha sido finalizado. ¡Gracias por tu confianza!`
      : `El estado de tu proyecto "${tituloProyecto}" ha cambiado a: ${estadoStr}.`;

    await invokeEdgeFunction("enviar-notificacion", {
      body: { usuario_id: usuarioId, proyecto_id: proyectoId, titulo, mensaje },
      userToken: session?.access_token || "",
    });
  } catch (err) {
    console.warn("[notifyClientStateChange] error:", err);
  }
};

const hasApprovedQuote = (proyecto) => getLatestCotizacion(proyecto)?.estado === "aprobada";

/*
  CHANGES ADDED (compared to initial project state):
  - `isPayable` helper: determines whether a proyecto/ticket is eligible for payment (added to centralize logic).
  - Guards around `selectedTicket.items` rendering to avoid runtime crashes when cotizacion or items are missing.
  - `handlePayment` changes: instead of inserting `pagos` directly from the browser (which failed due to RLS), the app now calls a server-side Edge Function `crear-pago` (located in `supabase/functions/crear-pago`) using the user's token. If network/CORS prevents calling the function, an offline fallback saves the pago in `localStorage` under `stathmos_offline_pagos` and updates the UI locally for testing.
  - List-level "Pagar" button behavior: opening the ticket from the list now shows the payment selector (not an empty form) for better UX.
  - Error handling & user feedback improved: shows actionable messages when RLS blocks inserts and provides offline fallback.

  Files modified/added:
  - `src/App.jsx`: helpers, guards, `handlePayment` integration with Edge Function and offline fallback, UI tweaks.
  - `supabase/functions/crear-pago/index.ts`: new Edge Function (Deno) that inserts `pagos` using service_role and updates proyecto state.

  Purpose: allow safe server-side creation of `pagos` (bypassing RLS securely) while providing a local offline mode for testing when Supabase access isn't available.
*/

const PAYMENT_ALLOWED_STATES = ["en_progreso", "pendiente_refaccion", "terminado"];

const isPayable = (ticket) => {
  const estadoRaw = typeof ticket === "string" ? ticket : ticket?.estado;
  const cotizacion = typeof ticket === "object" && ticket
    ? (ticket.cotizacion || getLatestCotizacion(ticket))
    : null;

  const estado = String(estadoRaw || "").toLowerCase().trim();
  const cotizacionAprobada = cotizacion?.estado === "aprobada";

  return PAYMENT_ALLOWED_STATES.includes(estado) && cotizacionAprobada;
};

const normalizeRole = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const getRoleFromSession = (session) => {
  const appRole = session?.user?.app_metadata?.rol;
  const metaRole = session?.user?.user_metadata?.rol;
  const rol = normalizeRole(appRole || metaRole || "");
  if (["administrador", "mecanico", "cliente"].includes(rol)) return rol;
  return "";
};

const getFunctionErrorMessage = async (invokeError, fallbackMessage) => {
  if (!invokeError) return fallbackMessage;

  const directMessage = invokeError?.message;
  const response = invokeError?.context;

  if (!response || typeof response.json !== "function") {
    return directMessage || fallbackMessage;
  }

  try {
    const payload = await response.clone().json();
    return payload?.error || payload?.message || directMessage || fallbackMessage;
  } catch {
    return directMessage || fallbackMessage;
  }
};

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

// UI components are now imported from UIPrimitives.jsx

// UI components are now imported from UIPrimitives.jsx


// UI components are now imported from UIPrimitives.jsx


// ─── Error Boundary (captura errores de render en UI) ───────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    this.setState({ error, info });
    console.error("ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h2 className="text-lg font-semibold text-red-600">Error en la UI</h2>
          <pre className="mt-3 whitespace-pre-wrap text-sm text-red-500">{String(this.state.error)}</pre>
          <details className="mt-2 text-xs text-gray-500">
            {this.state.info?.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

// UI primitives are now imported from UIPrimitives.jsx


// UI buttons are now using the Button component from UIPrimitives.jsx
const BtnAccent = ({ onClick, disabled, color, children, className = "" }) => (
  <Button onClick={onClick} disabled={disabled} color={color} className={className}>{children}</Button>
);

const BtnEdit = ({ onClick, darkMode }) => (
  <Button variant="ghost" darkMode={darkMode} onClick={onClick}>Editar</Button>
);

const BtnToggleActive = ({ onClick, isActive, darkMode }) => (
  <Button variant="ghost" darkMode={darkMode} onClick={onClick} 
    className={isActive ? "hover:border-red-800 hover:text-red-400" : "hover:border-emerald-800 hover:text-emerald-400"}
  >
    {isActive ? "Desactivar" : "Activar"}
  </Button>
);

const BtnCancelProject = ({ onClick, darkMode }) => (
  <Button variant="ghost" darkMode={darkMode} onClick={onClick} className="hover:border-red-800 hover:text-red-400">
    Cancelar
  </Button>
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
const ClientesModule = ({ darkMode, session }) => {
  const [clientes,     setClientes]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [form,  setForm]  = useState({ nombre: "", telefono: "", correo: "", direccion: "", rfc: "", activo: true });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("clientes").select("*").order("created_at", { ascending: false });
    setClientes(data || []); setLoading(false);
  }, []);
  useEffect(() => { fetchClientes(); }, [fetchClientes]);
  useSupabaseRealtime("clientes", fetchClientes);

  const openCreate = () => { setEditTarget(null); setForm({ nombre: "", telefono: "", correo: "", direccion: "", rfc: "", activo: true }); setFormError(""); setModalOpen(true); };
  const openEdit   = (c) => { setEditTarget(c); setForm({ nombre: c.nombre||"", telefono: c.telefono||"", correo: c.correo||"", direccion: c.direccion||"", rfc: c.rfc||"", activo: c.activo??true }); setFormError(""); setModalOpen(true); };

// ClientesModule helpers consolidated at top level

  const handleSave = async () => {
    // Validaciones de campos obligatorios
    if (!form.nombre || !form.nombre.trim()) {
      setFormError("El nombre es obligatorio.");
      return;
    }

    if (!form.telefono || !form.telefono.trim()) {
      setFormError("El teléfono es obligatorio.");
      return;
    }
    if (!isValidPhone(form.telefono)) {
      setFormError("El teléfono debe tener 10 dígitos numéricos.");
      return;
    }

    if (!form.correo || !form.correo.trim()) {
      setFormError("El correo electrónico es obligatorio.");
      return;
    }

    // Validar email
    if (!isValidEmail(form.correo)) {
      setFormError("El correo electrónico no es válido.");
      return;
    }

    // Validar RFC si se proporciona
    if (form.rfc && !isValidRFC(form.rfc)) {
      setFormError("El RFC no tiene un formato válido. Debe tener 12-13 caracteres (ej: GARC800101ABC).");
      return;
    }

    // Validar duplicidad de RFC
    if (form.rfc) {
      const { data: rfcExistente } = await supabase
        .from("clientes")
        .select("id")
        .eq("rfc", form.rfc.trim().toUpperCase())
        .maybeSingle();
      if (rfcExistente && rfcExistente.id !== editTarget?.id) {
        setFormError("Ya existe un cliente registrado con ese RFC.");
        return;
      }
    }

    setSaving(true);
    setFormError("");

    try {
      const payload = {
        nombre: normalizeForSAT(form.nombre),
        telefono: form.telefono ? form.telefono.trim() : null,
        correo: form.correo ? form.correo.trim().toLowerCase() : null,
        direccion: form.direccion ? form.direccion.trim() : null,
        rfc: form.rfc ? form.rfc.trim().toUpperCase() : null,
        activo: form.activo,
        updated_at: new Date().toISOString(),
      };

      if (editTarget) {
        // Actualizar cliente existente
        const { error } = await supabase.from("clientes").update(payload).eq("id", editTarget.id);
        if (error) throw error;
      } else {
        // Crear nuevo cliente y enviar invitación por correo desde Edge Function
        await invokeEdgeFunction("crear-cliente", {
          body: {
            nombre: payload.nombre,
            correo: payload.correo,
            telefono: payload.telefono,
            rfc: payload.rfc,
            direccion: payload.direccion,
          },
          userToken: session?.access_token || "",
        });
      }

      setModalOpen(false);
      setSearch(""); // Resetear búsqueda para mostrar todos los clientes
      fetchClientes();
    } catch (err) {
      setFormError(err.message || "Error al guardar cliente.");
    } finally {
      setSaving(false);
    }
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
  const normalizeEstado = (e) => String(e || "").toLowerCase().trim();
  const divider = darkMode ? "divide-zinc-800" : "divide-gray-100";
  const rowH    = darkMode ? "hover:bg-[#25252f]" : "hover:bg-gray-50";
  const headTxt = darkMode ? "text-zinc-500 border-zinc-800" : "text-gray-400 border-gray-100";

  const activeBadge = (active) => active
    ? darkMode ? "bg-emerald-900/40 text-emerald-400 border-emerald-800" : "bg-emerald-50 text-emerald-700 border-emerald-200"
    : darkMode ? "bg-zinc-800 text-zinc-500 border-zinc-700"             : "bg-gray-100 text-gray-400 border-gray-200";

  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <ModuleHeader
        title="Clientes"
        count={clientes.length}
        countLabel="registros"
        darkMode={darkMode}
        action={<BtnAccent onClick={openCreate} color={C_BLUE}>+ Nuevo Cliente</BtnAccent>}
      />

      <div className="mb-4">
        <Input darkMode={darkMode} icon="search" placeholder="Buscar por nombre, teléfono o correo…" value={search} onChange={(e) => setSearch(e.target.value)} />
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
          <Field label="Nombre" required darkMode={darkMode}><Input darkMode={darkMode} value={form.nombre} onChange={(e) => setForm({...form, nombre: normalizeUI(e.target.value)})} placeholder="JUAN GARCIA" /></Field>
          <Field label="Teléfono" required darkMode={darkMode}><Input darkMode={darkMode} value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} placeholder="311 123 4567" /></Field>
          <Field label="Correo" required darkMode={darkMode}><Input darkMode={darkMode} type="email" value={form.correo} onChange={(e) => setForm({...form, correo: e.target.value})} placeholder="juan@correo.com" /></Field>
          <Field label="Dirección" darkMode={darkMode}><Textarea darkMode={darkMode} rows={2} value={form.direccion} onChange={(e) => setForm({...form, direccion: normalizeUI(e.target.value)})} placeholder="CALLE, COLONIA, CIUDAD" /></Field>
          <Field label="RFC" darkMode={darkMode}><Input darkMode={darkMode} value={form.rfc} onChange={(e) => setForm({...form, rfc: normalizeUI(e.target.value)})} placeholder="GARC800101ABC" className="font-mono" /></Field>
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

// ─── EMPLEADOS MODULE ────────────────────────────────────────────────────────
const EmpleadosModule = ({ darkMode }) => {
  const [empleados,     setEmpleados]     = useState([]);
  const [usuarios,      setUsuarios]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [modalOpen,     setModalOpen]     = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [toggleTarget,  setToggleTarget]  = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [formError,     setFormError]     = useState("");
  const [form, setForm] = useState({
    usuario_id: "",
    nombre: "",
    telefono: "",
    correo: "",
    rfc: "",
    fecha_ingreso: todayWorkshopYmd(),
    disponible: true,
    activo: true,
  });

const fetchAll = useCallback(async () => {
  setLoading(true);
  const { data: e, error: eErr } = await supabase
    .from("empleados")
    .select("id,nombre,correo,usuario_id,telefono,rfc,fecha_ingreso,disponible,activo")
    .eq("activo", true)
    .order("nombre");
  
  setEmpleados(e || []);
  setLoading(false);
}, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useSupabaseRealtime("empleados", fetchAll);

  // Validar RFC con REGEX (formato mexicano)
// EmpleadosModule helpers consolidated at top level


  const openCreate = () => {
    setEditTarget(null);
    setForm({
      usuario_id: "",
      rol_destino: "Mecánico",
      nombre: "",
      telefono: "",
      correo: "",
      rfc: "",
      fecha_ingreso: todayWorkshopYmd(),
      disponible: true,
      activo: true,
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (e) => {
    setEditTarget(e);
    setForm({
      usuario_id: e.usuario_id || "",
      rol_destino: "Mecánico",
      nombre: e.nombre || "",
      telefono: e.telefono || "",
      correo: e.correo || "",
      rfc: e.rfc || "",
      fecha_ingreso: e.fecha_ingreso || "",
      disponible: e.disponible ?? true,
      activo: e.activo ?? true,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError("");

    let resultError = null;

    if (editTarget) {
      if (!form.nombre.trim() || !form.correo.trim() || !form.rfc.trim() || !form.telefono.trim()) {
        setFormError("Nombre, correo, RFC y teléfono son obligatorios.");
        setSaving(false); return;
      }
      
      if (!isValidRFC(form.rfc)) {
        setFormError("El RFC no tiene un formato válido. Debe tener 12-13 caracteres (ej: GARC800101ABC).");
        setSaving(false); return;
      }

      // Validar duplicidad RFC en empleados (editar)
      const { data: rfcExistenteEmp } = await supabase
        .from("empleados").select("id").eq("rfc", form.rfc.trim().toUpperCase()).maybeSingle();
      if (rfcExistenteEmp && rfcExistenteEmp.id !== editTarget?.id) {
        setFormError("Ya existe un empleado registrado con ese RFC.");
        setSaving(false); return;
      }

      if (!isValidPhone(form.telefono)) {
        setFormError("El teléfono debe tener 10 dígitos numéricos.");
        setSaving(false); return;
      }

      const payload = {
        nombre: normalizeForSAT(form.nombre),
        telefono: form.telefono.trim() || null,
        correo: form.correo.trim().toLowerCase(),
        rfc: form.rfc ? form.rfc.trim().toUpperCase() : null,
        fecha_ingreso: form.fecha_ingreso || null,
        disponible: form.disponible,
        activo: form.activo,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("empleados").update(payload).eq("id", editTarget.id);
      resultError = error?.message;
    } else {
      if (!form.nombre.trim() || !form.correo.trim() || !form.rol_destino || !form.rfc.trim() || !form.telefono.trim()) {
        setFormError("Nombre, correo, rol, RFC y teléfono son obligatorios.");
        setSaving(false); return;
      }
      
      if (!isValidRFC(form.rfc)) {
        setFormError("El RFC no tiene un formato válido. Debe tener 12-13 caracteres (ej: GARC800101ABC).");
        setSaving(false); return;
      }

      // Validar duplicidad RFC en empleados (crear)
      const { data: rfcExistenteNuevo } = await supabase
        .from("empleados").select("id").eq("rfc", form.rfc.trim().toUpperCase()).maybeSingle();
      if (rfcExistenteNuevo) {
        setFormError("Ya existe un empleado registrado con ese RFC.");
        setSaving(false); return;
      }

      if (!isValidPhone(form.telefono)) {
        setFormError("El teléfono debe tener 10 dígitos numéricos.");
        setSaving(false); return;
      }

      const { data, error } = await supabase.functions.invoke('crear-empleado', {
        body: {
          nombre: normalizeForSAT(form.nombre),
          correo: form.correo.trim().toLowerCase(),
          telefono: form.telefono.trim() || null,
          rfc: form.rfc ? form.rfc.trim().toUpperCase() : null,
          rol_destino: form.rol_destino,
          fecha_contratacion: form.fecha_ingreso || null,
        }
      });
      resultError = error?.message || (data && !data.success ? data.error : null);
    }

    setSaving(false);
    if (resultError) { setFormError(resultError); return; }
    setModalOpen(false);
    fetchAll();
  };

  const handleToggle = async () => {
    if (!toggleTarget) return;
    await supabase
      .from("empleados")
      .update({ activo: !toggleTarget.activo, updated_at: new Date().toISOString() })
      .eq("id", toggleTarget.id);
    setToggleTarget(null);
    fetchAll();
  };

  const filtered = empleados.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.nombre?.toLowerCase().includes(q) ||
      e.correo?.toLowerCase().includes(q) ||
      e.telefono?.toLowerCase().includes(q) ||
      e.rfc?.toLowerCase().includes(q)
    );
  });

  const t  = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";
  const divider = darkMode ? "divide-zinc-800" : "divide-gray-100";
  const rowH    = darkMode ? "hover:bg-[#25252f]" : "hover:bg-gray-50";
  const headTxt = darkMode ? "text-zinc-500 border-zinc-800" : "text-gray-400 border-gray-100";

  const activeBadge = (active) => active
    ? darkMode ? "bg-emerald-900/40 text-emerald-400 border-emerald-800" : "bg-emerald-50 text-emerald-700 border-emerald-200"
    : darkMode ? "bg-zinc-800 text-zinc-500 border-zinc-700"             : "bg-gray-100 text-gray-400 border-gray-200";

  const disponibleBadge = (disponible) => disponible
    ? darkMode ? "bg-sky-900/40 text-sky-300 border-sky-800" : "bg-sky-50 text-sky-700 border-sky-200"
    : darkMode ? "bg-zinc-800 text-zinc-500 border-zinc-700" : "bg-gray-100 text-gray-500 border-gray-200";

  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <ModuleHeader
        title="Personal"
        count={empleados.length}
        countLabel="registros"
        darkMode={darkMode}
        action={<BtnAccent onClick={openCreate} color={C_BLUE}>+ Nuevo Empleado</BtnAccent>}
      />

      <div className="mb-4">
        <Input darkMode={darkMode} icon="search" placeholder="Buscar por nombre, correo, teléfono o RFC…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card darkMode={darkMode} className="overflow-hidden">
        {loading ? (
          <div className={`p-12 text-center ${st} text-sm`}>Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className={`p-12 text-center ${st} text-sm`}>Sin resultados</div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b text-xs uppercase tracking-wider ${headTxt}`}>
                    {[
                      "Nombre", "Correo", "Teléfono", "RFC", "Usuario", "Ingreso", "Disponible", "Estado", ""
                    ].map((h, i) => (
                      <th key={i} className={`px-4 py-3 font-medium ${i === 8 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${divider}`}>
                  {filtered.map((e) => (
                    <tr key={e.id} className={`transition-colors ${rowH}`}>
                      <td className={`px-4 py-3 font-medium ${t}`}>{e.nombre}</td>
                      <td className={`px-4 py-3 ${st}`}>{e.correo}</td>
                      <td className={`px-4 py-3 ${st}`}>{e.telefono || "—"}</td>
                      <td className={`px-4 py-3 font-mono text-xs ${st}`}>{e.rfc || "—"}</td>
                      <td className={`px-4 py-3 ${st}`} title={e.usuario_id}>{e.usuarios?.nombre || e.usuario_id?.slice(0, 8) || "—"}</td>
                      <td className={`px-4 py-3 ${st} text-xs`}>{e.fecha_ingreso ? fmtDate(e.fecha_ingreso) : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${disponibleBadge(e.disponible)}`}>
                          {e.disponible ? "Sí" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${activeBadge(e.activo)}`}>
                          {e.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <BtnEdit onClick={() => openEdit(e)} darkMode={darkMode} />
                          <BtnToggleActive onClick={() => setToggleTarget(e)} isActive={e.activo} darkMode={darkMode} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`md:hidden divide-y ${divider}`}>
              {filtered.map((e) => (
                <div key={e.id} className="px-4 py-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`font-medium ${t}`}>{e.nombre}</p>
                      <p className={`text-xs ${st}`}>{e.correo}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${activeBadge(e.activo)}`}>
                      {e.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  {e.telefono && <p className={`text-xs ${st}`}>Tel: {e.telefono}</p>}
                  {e.rfc && <p className={`text-xs font-mono ${st}`}>RFC: {e.rfc}</p>}
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${disponibleBadge(e.disponible)}`}>
                      Disponible: {e.disponible ? "Sí" : "No"}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <BtnEdit onClick={() => openEdit(e)} darkMode={darkMode} />
                    <BtnToggleActive onClick={() => setToggleTarget(e)} isActive={e.activo} darkMode={darkMode} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "Editar Empleado" : "Nuevo Empleado"} darkMode={darkMode}>
        <div className="flex flex-col gap-4">
          {!editTarget && (
            <Field label="Rol del empleado" required darkMode={darkMode}>
              <Select darkMode={darkMode} value={form.rol_destino || "Mecánico"} onChange={(e) => setForm({ ...form, rol_destino: e.target.value })}>
                <option value="Mecánico">Mecánico</option>
                <option value="Administrador">Administrador</option>
              </Select>
            </Field>
          )}

          <Field label="Nombre" required darkMode={darkMode}>
            <Input darkMode={darkMode} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: normalizeUI(e.target.value) })} placeholder="NOMBRE DEL EMPLEADO" />
          </Field>
          
          <Field label="Teléfono" required darkMode={darkMode}>
            <Input darkMode={darkMode} value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="311 123 4567" />
          </Field>
          
          <Field label="Correo" required darkMode={darkMode}>
            <Input darkMode={darkMode} type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} placeholder="empleado@stathmos.mx" />
          </Field>
          
          <Field label="RFC" required darkMode={darkMode}>
            <Input darkMode={darkMode} value={form.rfc} onChange={(e) => setForm({ ...form, rfc: normalizeUI(e.target.value) })} placeholder="GARC800101ABC" className="font-mono" />
          </Field>

          <Field label="Fecha de ingreso" darkMode={darkMode}>
            <DatePicker
              value={form.fecha_ingreso || ""}
              onChange={(val) => setForm({ ...form, fecha_ingreso: val })}
              darkMode={darkMode}
              placeholder="Fecha de ingreso..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Disponible" darkMode={darkMode}>
              <Select darkMode={darkMode} value={form.disponible ? "true" : "false"} onChange={(e) => setForm({ ...form, disponible: e.target.value === "true" })}>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </Select>
            </Field>
            <Field label="Activo" darkMode={darkMode}>
              <Select darkMode={darkMode} value={form.activo ? "true" : "false"} onChange={(e) => setForm({ ...form, activo: e.target.value === "true" })}>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </Select>
            </Field>
          </div>

          {formError && <p className="text-xs" style={{ color: C_RED }}>{formError}</p>}

          <div className="flex gap-3 mt-1">
            <button onClick={() => setModalOpen(false)} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${darkMode ? "border-zinc-700 text-zinc-400" : "border-gray-200 text-gray-500"}`}>Cancelar</button>
            <BtnAccent onClick={handleSave} disabled={saving} color={C_BLUE} className="flex-1 justify-center">{saving ? "Guardando…" : editTarget ? "Actualizar" : "Crear"}</BtnAccent>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        title={toggleTarget?.activo ? "Desactivar Empleado" : "Activar Empleado"}
        message={`¿${toggleTarget?.activo ? "Desactivar" : "Activar"} a <strong>${toggleTarget?.nombre}</strong>?`}
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
  useSupabaseRealtime("vehiculos", fetchAll);

  const openCreate = () => { setEditTarget(null); setForm({ cliente_id: "", marca: "", modelo: "", anio: "", placas: "", vin: "", color: "", activo: true }); setFormError(""); setModalOpen(true); };
  const openEdit   = (v) => { setEditTarget(v); setForm({ cliente_id: v.cliente_id||"", marca: v.marca||"", modelo: v.modelo||"", anio: v.anio||"", placas: v.placas||"", vin: v.vin||"", color: v.color||"", activo: v.activo??true }); setFormError(""); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.cliente_id || !form.marca.trim() || !form.modelo.trim() || !form.placas.trim()) {
      setFormError("Cliente, marca, modelo y placas son obligatorios."); return;
    }
    if (form.anio && (isNaN(form.anio) || form.anio < 1900 || form.anio > new Date().getFullYear() + 1)) {
      setFormError("Año inválido."); return;
    }
    if (form.vin && !isValidVIN(form.vin)) {
      setFormError("El VIN no es válido. Debe tener exactamente 17 caracteres alfanuméricos (sin I, O ni Q)."); return;
    }
    if (form.vin) {
      const { data: vinExistente } = await supabase
        .from("vehiculos")
        .select("id")
        .eq("vin", form.vin.trim().toUpperCase())
        .maybeSingle();
      if (vinExistente && vinExistente.id !== editTarget?.id) {
        setFormError("Ya existe un vehículo registrado con ese VIN."); return;
      }
    }
    setSaving(true); setFormError("");
    const payload = {
      cliente_id: form.cliente_id,
      marca: normalizeForSAT(form.marca),
      modelo: normalizeForSAT(form.modelo),
      anio: form.anio ? parseInt(form.anio) : null,
      placas: normalizeForSAT(form.placas),
      vin: normalizeForSAT(form.vin) || null,
      color: normalizeForSAT(form.color) || null,
      activo: form.activo,
      updated_at: new Date().toISOString()
    };
    const { error } = editTarget
      ? await supabase.from("vehiculos").update(payload).eq("id", editTarget.id)
      : await supabase.from("vehiculos").insert([payload]);
    setSaving(false);
    if (error) { setFormError(error.message); return; }
    setModalOpen(false);
    setRefPickerOpen(false);
    setRefCartDraft(null);
    setRefCartTouched(false);
    fetchAll();
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
      <ModuleHeader
        title="Vehículos"
        count={vehiculos.length}
        countLabel="registros"
        darkMode={darkMode}
        action={<BtnAccent onClick={openCreate} color={C_BLUE}>+ Nuevo Vehículo</BtnAccent>}
      />

      <div className="mb-4">
        <Input darkMode={darkMode} icon="search" placeholder="Buscar por marca, modelo, placas o cliente…" value={search} onChange={(e) => setSearch(e.target.value)} />
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
            <Field label="Marca" required darkMode={darkMode}><Input darkMode={darkMode} value={form.marca} onChange={(e) => setForm({...form, marca: normalizeUI(e.target.value)})} placeholder="TOYOTA" /></Field>
            <Field label="Modelo" required darkMode={darkMode}><Input darkMode={darkMode} value={form.modelo} onChange={(e) => setForm({...form, modelo: normalizeUI(e.target.value)})} placeholder="COROLLA" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Año" darkMode={darkMode}><Input darkMode={darkMode} type="number" value={form.anio} onChange={(e) => setForm({...form, anio: e.target.value})} placeholder="2018" /></Field>
            <Field label="Color" darkMode={darkMode}><Input darkMode={darkMode} value={form.color} onChange={(e) => setForm({...form, color: normalizeUI(e.target.value)})} placeholder="BLANCO" /></Field>
          </div>
          <Field label="Placas" required darkMode={darkMode}>
            <Input darkMode={darkMode} value={form.placas} onChange={(e) => setForm({...form, placas: normalizeUI(e.target.value)})} placeholder="ABC-123-D" className="font-mono" />
          </Field>
          <Field label="VIN" darkMode={darkMode}>
            <Input darkMode={darkMode} value={form.vin} onChange={(e) => setForm({...form, vin: normalizeUI(e.target.value)})} placeholder="1HGCM82633A123456" className="font-mono" />
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
const ProyectosModule = ({ darkMode, session, initialProjectId = null }) => {
  const [proyectos,  setProyectos]  = useState([]);
  const [clientes,   setClientes]   = useState([]);
  const [vehiculos,  setVehiculos]  = useState([]);
  const [empleados,  setEmpleados]  = useState([]);
  const [citas,         setCitas]         = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [entregadoError, setEntregadoError] = useState("");
  const [form, setForm] = useState({ titulo: "", descripcion: "", cliente_id: "", vehiculo_id: "", mecanico_id: "", estado: "pendiente_diagnostico", bloqueado: false, monto_mano_obra: "", monto_refacc: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [filteredVehiculos, setFilteredVehiculos] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [stateConfirm, setStateConfirm] = useState(null);

  const handleProyectoActualizado = (updates) => {
    if (!updates?.id) return;

    setProyectos((prev) => prev.map((p) => (p.id === updates.id ? { ...p, ...updates } : p)));
    setDetalle((prev) => (prev?.id === updates.id ? { ...prev, ...updates } : prev));
  };

  const hasApprovedPaymentForProject = async (proyectoId) => {
    const { data, error } = await supabase
      .from("pagos")
      .select("id")
      .eq("proyecto_id", proyectoId)
      .eq("estado", "completado")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data?.id);
  };
  const [refCatalog, setRefCatalog] = useState([]);
  const [refSearch, setRefSearch] = useState("");
  const [refCart, setRefCart] = useState([]);
  const [refCartDraft, setRefCartDraft] = useState(null);
  const [refPickerOpen, setRefPickerOpen] = useState(false);
  const [refCartTouched, setRefCartTouched] = useState(false);
  // Ref hacia EditRefaccionesSection para abrir el picker desde la seccion Cotizacion Inicial
  const editRefSeccionRef = useRef(null);

  // ─── Diagnóstico inicial en el modal ─────────────────────────────────────────
  const DIAG_TIPOS = ["inicial", "preventivo", "correctivo", "revision"];
  const diagFormInit = { tipo_operacion: "preventivo", sintomas: "", descripcion: "", causa_raiz: "" };
  const [diagForm,     setDiagForm]     = useState(diagFormInit);
  const [diagError,    setDiagError]    = useState("");
  // Diagnóstico existente en el proyecto que se está editando
  const [existingDiag, setExistingDiag] = useState(null);
  // Bandera separada: si estamos editando el diagnóstico ya guardado
  const [editandoDiag, setEditandoDiag] = useState(false);

  // ─── Obtener rol del usuario actual ───────────────────────────────────────────
  const metaRole = (session?.user?.user_metadata?.rol || session?.user?.app_metadata?.rol || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  const isAdmin = metaRole === "administrador";
  const isMecanico = metaRole === "mecanico";

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [p, c, v, e, r, ci] = await Promise.all([  // ← agrega ci
      supabase.from("proyectos").select("*,observaciones, clientes(nombre, usuario_id), vehiculos(marca,modelo,placas), empleados(nombre), diagnosticos(id,tipo,sintomas,descripcion,causa_raiz,created_at,empleados(nombre),tipo_operacion), cotizaciones(id,monto_mano_obra,monto_refacc,monto_total,estado,created_at,updated_at,fecha_emision,fecha_respuesta)").order("created_at", { ascending: false }),
      supabase.from("clientes").select("id,nombre,usuario_id").eq("activo", true).order("nombre"),
      supabase.from("vehiculos").select("id,cliente_id,marca,modelo,placas").eq("activo", true),
      supabase.from("empleados").select("id,nombre,correo,usuario_id").eq("activo", true).order("nombre"),
      supabase.from("refacciones").select("id,nombre,numero_parte,precio_venta,stock,activo").eq("activo", true).order("nombre"),
      supabase.from("citas").select("id,cliente_id,vehiculo_id,fecha_hora,motivo,estado,proyectos(id)").in("estado", ["pendiente", "confirmada"]).order("fecha_hora"),
    ]);
    setProyectos(p.data||[]); setClientes(c.data||[]); setVehiculos(v.data||[]); setEmpleados(e.data||[]); setRefCatalog(r.data||[]); setCitas(ci.data||[]); setLoading(false);  // ← agrega setCitas
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Usar el hook global en lugar de la suscripción manual
  useSupabaseRealtime("proyectos", fetchAll);
  useSupabaseRealtime("cotizaciones", fetchAll);
  useSupabaseRealtime("fotografias", fetchAll);

  useEffect(() => {
    if (initialProjectId && proyectos.length > 0) {
      const target = proyectos.find(p => p.id === initialProjectId);
      if (target) setDetalle(target);
    }
  }, [initialProjectId, proyectos]);

  useEffect(() => {
    const vehiculoEnProyectoActivo = new Set(
      proyectos
        .filter((p) => p.vehiculo_id && !["entregado", "cancelado"].includes(p.estado) && p.id !== editTarget?.id)
        .map((p) => p.vehiculo_id)
    );

    const disponibles = form.cliente_id
      ? vehiculos.filter((v) => v.cliente_id === form.cliente_id && (!vehiculoEnProyectoActivo.has(v.id) || v.id === editTarget?.vehiculo_id))
      : [];

    setFilteredVehiculos(disponibles);

    if (form.vehiculo_id && !disponibles.some((v) => v.id === form.vehiculo_id)) {
      setForm((prev) => (prev.vehiculo_id ? { ...prev, vehiculo_id: "" } : prev));
    }
  }, [form.cliente_id, form.vehiculo_id, vehiculos, proyectos, editTarget?.id, editTarget?.vehiculo_id]);

  const refCartTotal = useMemo(() => (
    refCart.reduce((sum, item) => sum + Number(item.precio_unit || 0) * Number(item.cantidad || 0), 0)
  ), [refCart]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      monto_refacc: refCart.length ? refCartTotal.toFixed(2) : "",
    }));
  }, [refCartTotal, refCart.length]);

  const openRefPicker = () => {
    setRefCartDraft(refCart);
    setRefPickerOpen(true);
    setRefSearch("");
  };

  const addRefToDraft = (refaccion) => {
    setRefCartDraft((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      const existing = list.find((item) => item.id === refaccion.id);
      const cantidadActual = existing ? existing.cantidad : 0;
      const stockDisponible = Number(refaccion.stock || 0);

      // Bloquear si no hay stock suficiente
      if (stockDisponible <= 0) return list; // sin stock, no agrega
      if (cantidadActual >= stockDisponible) return list; // ya llegó al límite

      if (existing) {
        return list.map((item) =>
          item.id === refaccion.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [
        ...list,
        {
          id: refaccion.id,
          nombre: refaccion.nombre,
          numero_parte: refaccion.numero_parte || "",
          cantidad: 1,
          precio_unit: Number(refaccion.precio_venta || 0),
          stock: stockDisponible,
        },
      ];
    });
  };

  const updateRefDraftItem = (id, patch) => {
    setRefCartDraft((prev) => (Array.isArray(prev) ? prev.map((item) => (item.id === id ? { ...item, ...patch } : item)) : prev));
  };

  const getRefCartItemMaxCantidad = (item) => {
    const baseQty = Number((refCart || []).find((r) => r.id === item.id)?.cantidad || 0);
    const stockNow = Number((refCatalog || []).find((r) => r.id === item.id)?.stock ?? item.stock ?? 0);
    return Math.max(1, baseQty + Math.max(0, stockNow));
  };

  const normalizeCantidadConStock = (rawValue, maxCantidad) => {
    const parsed = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(parsed) || parsed < 1) return 1;
    return Math.min(parsed, Math.max(1, Number(maxCantidad || 1)));
  };

  const removeRefDraftItem = (id) => {
    setRefCartDraft((prev) => (Array.isArray(prev) ? prev.filter((item) => item.id !== id) : prev));
  };

  const confirmRefPicker = () => {
    setRefCart(Array.isArray(refCartDraft) ? refCartDraft : []);
    setRefCartTouched(true);
    setRefPickerOpen(false);
    setRefCartDraft(null);
  };

  const cancelRefPicker = () => {
    setRefPickerOpen(false);
    setRefCartDraft(null);
  };

  const clearRefCart = () => {
    setRefCart([]);
    setRefCartTouched(true);
    setRefPickerOpen(false);
    setRefCartDraft(null);
  };

  const refFiltered = refCatalog.filter((r) =>
    r.nombre?.toLowerCase().includes(refSearch.toLowerCase()) ||
    r.numero_parte?.toLowerCase().includes(refSearch.toLowerCase())
  );

  const adminManualStatusOptions = useMemo(() => {
    if (!editTarget) return [];
    const cotizacionAprobada = editTarget.cotizaciones?.some(c => c.estado === "aprobada");
    const base = cotizacionAprobada
      ? ["en_progreso", "pendiente_refaccion", "terminado", "entregado", "cancelado"]
      : ["cancelado"];
    const current = form.estado;
    return base.includes(current) ? base : [current, ...base];
  }, [editTarget, form.estado]);

  const openCreate = () => {
    if (!isAdmin) {
      setFormError("Solo administradores pueden crear nuevos proyectos.");
      return;
    }
    setEditTarget(null);
    setForm({ titulo: "", descripcion: "", cliente_id: "", vehiculo_id: "", mecanico_id: "", estado: "pendiente_diagnostico", bloqueado: false, monto_mano_obra: "", monto_refacc: "", cita_id: "" });    setFormError("");
    setRefCart([]);
    setRefCartDraft(null);
    setRefSearch("");
    setRefPickerOpen(false);
    setRefCartTouched(false);
    setDiagForm(diagFormInit);
    setDiagError("");
    setExistingDiag(null);
    setEditandoDiag(false);
    setModalOpen(true);
  };
  const openEdit = async (p) => {
    // Validar permisos: mecánico solo en ciertos estados
    if (isMecanico && !["en_progreso", "pendiente_refaccion", "terminado"].includes(p.estado)) {
      setFormError(`Mecánicos solo pueden editar proyectos en: En progreso, Pendiente (refacción), o Terminado. Este proyecto está en: ${estadoLabel(p.estado)}`);
      return;
    }
    
    const cotizacion = getLatestCotizacion(p);
    setEditTarget(p);
    setForm({
      titulo: p.titulo || "",
      descripcion: p.descripcion || "",
      cliente_id: p.cliente_id || "",
      vehiculo_id: p.vehiculo_id || "",
      mecanico_id: p.mecanico_id || "",
      estado: p.estado || "pendiente_diagnostico",
      bloqueado: p.bloqueado ?? false,
      monto_mano_obra: cotizacion?.monto_mano_obra != null ? String(cotizacion.monto_mano_obra) : "",
      monto_refacc: cotizacion?.monto_refacc != null ? String(cotizacion.monto_refacc) : "",
      cita_id: p.cita_id || "",
    });
    setFormError("");
    setRefSearch("");
    setRefPickerOpen(false);
    setRefCartDraft(null);
    setRefCartTouched(false);
    // Cargar diagnóstico inicial existente
    const diagInicial = Array.isArray(p.diagnosticos)
      ? p.diagnosticos.find(d => d.tipo === "inicial")
      : null;
      if (diagInicial) {
      setExistingDiag(diagInicial);
      setDiagForm({ tipo_operacion: diagInicial.tipo_operacion || "preventivo", sintomas: diagInicial.sintomas || "", descripcion: diagInicial.descripcion || "", causa_raiz: diagInicial.causa_raiz || "" });
    } else {
      setExistingDiag(null);
      setDiagForm(diagFormInit);
    }
    setDiagError("");
    setEditandoDiag(false);
    if (cotizacion?.id) {
      const { data: items } = await supabase
        .from("cotizacion_items")
        .select("id, refaccion_id, cantidad, precio_unit, tipo, refacciones (nombre, numero_parte)")
        .eq("cotizacion_id", cotizacion.id)
        .eq("tipo", "refaccion");
      const mapped = (items || []).map((item) => ({
        id: item.refaccion_id,
        nombre: item.refacciones?.nombre || item.refaccion_id,
        numero_parte: item.refacciones?.numero_parte || "",
        cantidad: item.cantidad || 1,
        precio_unit: Number(item.precio_unit || 0),
      }));
      setRefCart(mapped);
    } else {
      setRefCart([]);
    }
    setModalOpen(true);
  };

  const notifyMecanicoAsignacion = async ({ proyectoId, mecanicoId, tituloProyecto }) => {
    if (!mecanicoId) return;
    try {
      const cachedEmpleado = (empleados || []).find((e) => e.id === mecanicoId) || null;
      let usuarioId = cachedEmpleado?.usuario_id || null;
      let correo = cachedEmpleado?.correo || null;

      if (!usuarioId || !correo) {
        const { data: empleado, error: empleadoErr } = await supabase
          .from("empleados")
          .select("usuario_id, correo")
          .eq("id", mecanicoId)
          .maybeSingle();

        if (!empleadoErr) {
          usuarioId = usuarioId || empleado?.usuario_id || null;
          correo = correo || empleado?.correo || null;
        }
      }

      if (!usuarioId && correo) {
        const { data: usuario } = await supabase
          .from("usuarios")
          .select("id")
          .eq("correo", correo)
          .maybeSingle();
        usuarioId = usuario?.id || null;
      }

      if (!usuarioId) return;

      const titulo = "Nuevo proyecto asignado";
      const mensaje = `Se te asigno el proyecto "${tituloProyecto}".`;

      await invokeEdgeFunction("enviar-notificacion", {
        body: {
          usuario_id: usuarioId,
          proyecto_id: proyectoId,
          titulo,
          mensaje,
        },
        userToken: session?.access_token || "",
      });
    } catch (err) {
      console.warn("[notifyMecanicoAsignacion] error:", err);
    }
  };

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.cliente_id || !form.vehiculo_id) { setFormError("Título, cliente y vehículo son obligatorios."); return; }

    const vehiculoOcupado = proyectos.some((p) =>
      p.vehiculo_id === form.vehiculo_id &&
      !["entregado", "cancelado"].includes(p.estado) &&
      (!editTarget || p.id !== editTarget.id)
    );

    if (vehiculoOcupado) {
      setFormError("Ese vehículo cuenta con un proyecto activo.");
      return;
    }

    setSaving(true); setFormError("");
    const manoObra = form.monto_mano_obra === "" ? 0 : Number(form.monto_mano_obra);
    const refacc = Number(refCartTotal || 0);

    if (!Number.isFinite(manoObra) || !Number.isFinite(refacc) || manoObra < 0 || refacc < 0) {
      setSaving(false);
      setFormError("La cotización debe contener montos válidos (mayores o iguales a 0).");
      return;
    }

    if (editTarget && form.estado !== editTarget.estado) {
      if (isMecanico) {
        setSaving(false);
        setFormError("Los mecánicos no pueden cambiar manualmente el estado desde este formulario.");
        return;
      }

      if (isAdmin) {
        const adminAllowed = ["en_progreso", "pendiente_refaccion", "terminado", "entregado", "cancelado"];
        if (!adminAllowed.includes(form.estado)) {
          setSaving(false);
          setFormError("Solo puedes cambiar manualmente a: En progreso, Pendiente (refacción), Terminado, Entregado o Cancelado.");
          return;
        }
      }

      if (form.estado === "entregado") {
        if (!isAdmin) {
          setSaving(false);
          setFormError("Solo el administrador puede marcar un proyecto como entregado.");
          return;
        }
        try {
          const hasApprovedPayment = await hasApprovedPaymentForProject(editTarget.id);
          if (!hasApprovedPayment) {
            setSaving(false);
            setEntregadoError("No es posible marcar como entregado sin un pago aprobado.");
            return;
          }
        } catch (paymentCheckErr) {
          setSaving(false);
          setEntregadoError(paymentCheckErr?.message || "No se pudo validar el pago del proyecto.");
          return;
        }
      }

      if (form.estado === "cancelado" && !isAdmin) {
        setSaving(false);
        setFormError("Solo el administrador puede cancelar un proyecto.");
        return;
      }
    }

    const syncRefaccionItems = async (cotizacionId, proyectoId) => {
      if (!refCartTouched || !cotizacionId) return null;

      const { data: prevItems, error: prevItemsError } = await supabase
        .from("cotizacion_items")
        .select("id,refaccion_id,cantidad,precio_unit")
        .eq("cotizacion_id", cotizacionId)
        .eq("tipo", "refaccion");
      if (prevItemsError) return prevItemsError;

      const prevMap = new Map(
        (prevItems || [])
          .filter((item) => item.refaccion_id)
          .map((item) => [item.refaccion_id, item])
      );
      const nextMap = new Map(
        (refCart || [])
          .filter((item) => item.id)
          .map((item) => [item.id, item])
      );

      const ventasPendientes = [];

      // Diferencias de inventario:
      // - cantidad baja o pieza eliminada -> COMPRA (regresa al stock)
      // - cantidad sube o pieza nueva -> VENTA (sale de stock)
      for (const [refaccionId, prevItem] of prevMap.entries()) {
        const nextItem = nextMap.get(refaccionId);
        const prevQty = Number(prevItem.cantidad || 0);
        const nextQty = Number(nextItem?.cantidad || 0);

        if (nextQty < prevQty) {
          await supabase.functions.invoke("gestionar-inventario", {
            body: {
              tipo_operacion: "COMPRA",
              refaccion_id: refaccionId,
              cantidad: prevQty - nextQty,
              precio_unit: Number(nextItem?.precio_unit || prevItem.precio_unit || 0),
              cotizacion_id: cotizacionId,
              proyecto_id: proyectoId || null,
            },
          });
        }
      }

      for (const [refaccionId, nextItem] of nextMap.entries()) {
        const prevItem = prevMap.get(refaccionId);
        const prevQty = Number(prevItem?.cantidad || 0);
        const nextQty = Number(nextItem.cantidad || 0);

        if (nextQty > prevQty) {
          ventasPendientes.push({ refaccion_id: refaccionId, cantidad: nextQty - prevQty });
        }
      }

      if (ventasPendientes.length > 0) {
        const refIds = ventasPendientes.map((v) => v.refaccion_id);
        const { data: stockRows, error: stockError } = await supabase
          .from("refacciones")
          .select("id,nombre,stock")
          .in("id", refIds);
        if (stockError) return stockError;

        const stockMap = new Map((stockRows || []).map((row) => [row.id, row]));
        const sinStock = ventasPendientes
          .map((v) => {
            const row = stockMap.get(v.refaccion_id);
            const disponible = Number(row?.stock || 0);
            return disponible < Number(v.cantidad || 0)
              ? { nombre: row?.nombre || "Refacción", requerido: Number(v.cantidad || 0), disponible }
              : null;
          })
          .filter(Boolean);

        if (sinStock.length > 0) {
          const detalle = sinStock
            .map((i) => `${i.nombre} (disp: ${i.disponible}, req: ${i.requerido})`)
            .join(", ");
          return new Error(`Stock insuficiente para actualizar la cotización: ${detalle}.`);
        }

        for (const venta of ventasPendientes) {
          await supabase.functions.invoke("gestionar-inventario", {
            body: {
              tipo_operacion: "VENTA",
              refaccion_id: venta.refaccion_id,
              cantidad: venta.cantidad,
              precio_unit: Number(nextMap.get(venta.refaccion_id)?.precio_unit || 0),
              cotizacion_id: cotizacionId,
              proyecto_id: proyectoId || null,
            },
          });
        }
      }

      const deleteRes = await supabase
        .from("cotizacion_items")
        .delete()
        .eq("cotizacion_id", cotizacionId)
        .eq("tipo", "refaccion");
      if (deleteRes.error) return deleteRes.error;

      if (refCart.length > 0) {
        const rows = refCart.map((item) => ({
          cotizacion_id: cotizacionId,
          descripcion: item.nombre || "Refaccion",
          tipo: "refaccion",
          refaccion_id: item.id,
          cantidad: Number(item.cantidad || 1),
          precio_unit: Number(item.precio_unit || 0),
        }));

        const insertRes = await supabase.from("cotizacion_items").insert(rows);
        if (insertRes.error) return insertRes.error;
      }

      if (proyectoId) {
        const { error: deleteProyectoRefErr } = await supabase
          .from("proyecto_refacciones")
          .delete()
          .eq("proyecto_id", proyectoId);
        if (deleteProyectoRefErr) return deleteProyectoRefErr;

        if (refCart.length > 0) {
          const proyectoRefRows = refCart.map((item) => ({
            proyecto_id: proyectoId,
            refaccion_id: item.id,
            cantidad: Number(item.cantidad || 1),
            precio_unitario: Number(item.precio_unit || 0),
            fue_usada: true,
          }));

          const { error: insertProyectoRefErr } = await supabase
            .from("proyecto_refacciones")
            .insert(proyectoRefRows);
          if (insertProyectoRefErr) return insertProyectoRefErr;
        }
      }

      return null;
    };
      const tieneDiag = diagForm.sintomas.trim();
      const tieneCot  = manoObra > 0 || refacc > 0;
      const estadoInicial = !tieneDiag
        ? "pendiente_diagnostico"
        : tieneCot
          ? "pendiente_aprobacion"
          : "pendiente_cotizacion";

      // Al editar, recalcular estado solo si está en etapas tempranas donde el diagnóstico/cotización lo mueven
      const estadosAutoRecalculables = ["pendiente_diagnostico", "pendiente_cotizacion"];
      const estadoFinalEdit = estadosAutoRecalculables.includes(form.estado)
        ? estadoInicial
        : form.estado;
    const payload = {
      titulo: normalizeForSAT(form.titulo),
      descripcion: form.descripcion || null,
      cliente_id: form.cliente_id,
      vehiculo_id: form.vehiculo_id,
      mecanico_id: form.mecanico_id || null,
      cita_id: form.cita_id || null, 
      estado: editTarget ? estadoFinalEdit : estadoInicial,
      bloqueado: form.bloqueado,
      updated_at: new Date().toISOString()
    };
    let error = null;
    let proyectoIdFinal = editTarget?.id || null;

    if (editTarget) {
      const prevMecanicoId = editTarget.mecanico_id || null;
      const latestFromTarget = getLatestCotizacion(editTarget);
      const quoteChanged = Boolean(latestFromTarget) && (
        Number(latestFromTarget.monto_mano_obra || 0) !== manoObra ||
        Number(latestFromTarget.monto_refacc || 0) !== refacc
      );

      {/* Esto ya no es necesario porque el estado cambia automáticamente segun el diagnóstico y la cotización, pero dejo la validación lista por si acaso cambiamos la lógica}
      if (form.estado === "en_progreso") {
        const canStart = Boolean(latestFromTarget && latestFromTarget.estado === "aprobada" && !quoteChanged);
        if (!canStart) {
          setSaving(false);
          setFormError("No puedes iniciar ejecución sin cotización aprobada por el cliente.");
          return;
        }
      }
      */}

      const projectRes = await supabase.from("proyectos").update(payload).eq("id", editTarget.id);
      error = projectRes.error;
      if (!error) {
        const citaAnterior = editTarget.cita_id;
        const citaNueva = form.cita_id;
        if (citaAnterior && citaAnterior !== citaNueva) {
          await supabase.from("citas")
            .update({ estado: "pendiente", updated_at: new Date().toISOString() })
            .eq("id", citaAnterior);
        }
        if (citaNueva && citaNueva !== citaAnterior) {
          await supabase.from("citas")
            .update({ estado: "confirmada", updated_at: new Date().toISOString() })
            .eq("id", citaNueva);
        }
        if (estadoFinalEdit === "entregado" && (citaNueva || citaAnterior)) {
          const citaACompletar = citaNueva || citaAnterior;
          await supabase.from("citas")
            .update({ estado: "completada", updated_at: new Date().toISOString() })
            .eq("id", citaACompletar);
        }
      }
      if (!error && form.mecanico_id && form.mecanico_id !== prevMecanicoId) {
        await notifyMecanicoAsignacion({
          proyectoId: editTarget.id,
          mecanicoId: form.mecanico_id,
          tituloProyecto: form.titulo,
        });
      }

      if (!error && estadoFinalEdit !== editTarget.estado) {
        await notifyClientStateChange({
          proyectoId: editTarget.id,
          clienteId: form.cliente_id,
          tituloProyecto: form.titulo,
          nuevoEstado: estadoFinalEdit,
          session,
        });
      }

      if (!error) {
        const { data: existingCotizacion, error: quoteFetchError } = await supabase
          .from("cotizaciones")
          .select("id,monto_mano_obra,monto_refacc,estado")
          .eq("proyecto_id", editTarget.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (quoteFetchError) {
          error = quoteFetchError;
        } else if (existingCotizacion?.id) {
          const quoteChangedInDb = Number(existingCotizacion.monto_mano_obra || 0) !== manoObra || Number(existingCotizacion.monto_refacc || 0) !== refacc;
          const quotePayload = { monto_mano_obra: manoObra, monto_refacc: refacc, updated_at: new Date().toISOString() };

          if (quoteChangedInDb) {
            quotePayload.estado = existingCotizacion.estado === "pendiente" ? "pendiente" : "modificada";
            quotePayload.aprobada_por = null;
            quotePayload.rechazada_por = null;
            quotePayload.fecha_respuesta = null;
          }

          const quoteUpdate = await supabase
            .from("cotizaciones")
            .update(quotePayload)
            .eq("id", existingCotizacion.id);
          error = quoteUpdate.error;

          // Mover a pendiente_aprobacion si hay cotización activa (cambiada o no) y el proyecto está en etapa temprana
          if (!error) {
            const estadosCotizacionActiva = ["pendiente", "modificada"];
            const estadosQueRequierenAprobacion = ["pendiente_cotizacion", "pendiente_diagnostico"];
            if (
              estadosCotizacionActiva.includes(quoteChangedInDb ? quotePayload.estado : existingCotizacion.estado) &&
              estadosQueRequierenAprobacion.includes(estadoFinalEdit)
            ) {
              const { error: projectStatusErr } = await supabase
                .from("proyectos")
                .update({ estado: "pendiente_aprobacion", updated_at: new Date().toISOString() })
                .eq("id", editTarget.id);
              if (projectStatusErr) error = projectStatusErr;
            } else if (quoteChangedInDb) {
              const { error: projectStatusErr } = await supabase
                .from("proyectos")
                .update({ estado: "pendiente_aprobacion", updated_at: new Date().toISOString() })
                .eq("id", editTarget.id);
              if (projectStatusErr) error = projectStatusErr;
            }
          }
          if (!error) {
            const syncErr = await syncRefaccionItems(existingCotizacion.id, editTarget.id);
            if (syncErr) error = syncErr;
          }
        } else if (manoObra > 0 || refacc > 0) {
          const quoteInsert = await supabase
            .from("cotizaciones")
            .insert([{ proyecto_id: editTarget.id, monto_mano_obra: manoObra, monto_refacc: refacc, estado: "pendiente" }])
            .select("id")
            .single();
          error = quoteInsert.error;
          if (!error) {
            const { error: projectStatusErr } = await supabase
              .from("proyectos")
              .update({ estado: "pendiente_aprobacion", updated_at: new Date().toISOString() })
              .eq("id", editTarget.id);
            if (projectStatusErr) {
              error = projectStatusErr;
            }
          }
          if (!error) {
            const syncErr = await syncRefaccionItems(quoteInsert.data?.id, editTarget.id);
            if (syncErr) error = syncErr;
          }
        }

      }
    } else {
      const { data: createdProject, error: createError } = await supabase
        .from("proyectos")
        .insert([{ ...payload, fecha_ingreso: new Date().toISOString() }])
        .select("id")
        .single();
      error = createError;
      if (!error && createdProject?.id) proyectoIdFinal = createdProject.id;

      if (!error && form.cita_id) {  
        await supabase
          .from("citas")
          .update({ estado: "confirmada", updated_at: new Date().toISOString() })
          .eq("id", form.cita_id);
      }


      if (!error && createdProject?.id && form.mecanico_id) {
        await notifyMecanicoAsignacion({
          proyectoId: createdProject.id,
          mecanicoId: form.mecanico_id,
          tituloProyecto: form.titulo,
        });
      }

      if (!error && createdProject?.id && (manoObra > 0 || refacc > 0)) {
        const quoteInsert = await supabase
          .from("cotizaciones")
          .insert([{ proyecto_id: createdProject.id, monto_mano_obra: manoObra, monto_refacc: refacc, estado: "pendiente" }])
          .select("id")
          .single();
        error = quoteInsert.error;
        if (!error) {
          const syncErr = await syncRefaccionItems(quoteInsert.data?.id, createdProject.id);
          if (syncErr) error = syncErr;
        }
      }
    }

    setSaving(false);
    if (error) { setFormError(error.message); return; }

    // ── Guardar diagnóstico inicial si se llenó ───────────────────────────────
    const diagTieneDatos = diagForm.sintomas.trim() || diagForm.descripcion.trim() || diagForm.causa_raiz.trim();
        if (diagTieneDatos && proyectoIdFinal) {
          let mecId = form.mecanico_id || editTarget?.mecanico_id || null;
          // Si no hay mecánico asignado, usar el usuario logueado
          if (!mecId && session?.user?.email) {
            const { data: empData } = await supabase
              .from("empleados")
              .select("id")
              .eq("correo", session.user.email)
              .maybeSingle();
            mecId = empData?.id || null;
          }
      if (mecId) {
        let diagSaved = false;
        if (existingDiag?.id && editandoDiag) {
          // Actualizar diagnóstico existente
          await supabase.from("diagnosticos").update({
            tipo: "inicial",
            tipo_operacion: diagForm.tipo_operacion || "preventivo",
            sintomas: diagForm.sintomas.trim() || null,
            descripcion: diagForm.descripcion.trim() || null,
            causa_raiz: diagForm.causa_raiz.trim() || null,
          }).eq("id", existingDiag.id);
          diagSaved = true;
        } else if (!existingDiag) {
          // Insertar nuevo diagnóstico (verificar que no exista ya)
          const { data: diagCheck } = await supabase
            .from("diagnosticos")
            .select("id")
            .eq("proyecto_id", proyectoIdFinal)
            .eq("tipo", "inicial")
            .maybeSingle();
          if (!diagCheck) {
            await supabase.from("diagnosticos").insert([{
              proyecto_id: proyectoIdFinal,
              mecanico_id: mecId,
              tipo: "inicial",
              tipo_operacion: diagForm.tipo_operacion || "preventivo",
              sintomas: diagForm.sintomas.trim() || null,
              descripcion: diagForm.descripcion.trim() || null,
              causa_raiz: diagForm.causa_raiz.trim() || null,
            }]);
            diagSaved = true;
          }
        }
      }
    }

    setModalOpen(false);
      const { data: freshProyectos } = await supabase
        .from("proyectos")
        .select("*, clientes(nombre, usuario_id), vehiculos(marca,modelo,placas), empleados(nombre), diagnosticos(id,tipo,sintomas,descripcion,causa_raiz,created_at,empleados(nombre),tipo_operacion), cotizaciones(id,monto_mano_obra,monto_refacc,monto_total,estado,created_at,updated_at,fecha_emision,fecha_respuesta)")
        .order("created_at", { ascending: false });
      if (freshProyectos) {
        setProyectos(freshProyectos);
        if (detalle) setDetalle(freshProyectos.find(p => p.id === detalle.id) || null);
      }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("proyectos").update({ estado: "cancelado" }).eq("id", deleteTarget.id);

    await notifyClientStateChange({
      proyectoId: deleteTarget.id,
      clienteId: deleteTarget.cliente_id,
      tituloProyecto: deleteTarget.titulo,
      nuevoEstado: "cancelado",
      session,
    });

    setDeleteTarget(null); fetchAll();
  };

  const ESTADOS_ACTIVOS = ["pendiente_diagnostico","pendiente_cotizacion","pendiente_aprobacion","en_progreso","pendiente_refaccion","terminado"];
  const ESTADOS_INACTIVOS = ["entregado","no_aprobado","cancelado"];

  const filtered = proyectos.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = p.titulo?.toLowerCase().includes(q) || p.clientes?.nombre?.toLowerCase().includes(q) || p.vehiculos?.placas?.toLowerCase().includes(q);
    if (filterEstado === "todos") return matchSearch && ESTADOS_ACTIVOS.includes(p.estado);
    if (filterEstado === "archivados") return matchSearch && ESTADOS_INACTIVOS.includes(p.estado);
    return matchSearch && p.estado === filterEstado;
  });

  const t  = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";
  const divider = darkMode ? "divide-zinc-800" : "divide-gray-100";
  const rowH    = darkMode ? "hover:bg-[#25252f]" : "hover:bg-gray-50";
  const headTxt = darkMode ? "text-zinc-500 border-zinc-800" : "text-gray-400 border-gray-100";

  const handleAdminEstadoChange = async (nextEstado) => {
    setFormError("");
    const cotizacionAprobada = editTarget?.cotizaciones?.some(c => c.estado === "aprobada");
    if (!cotizacionAprobada && nextEstado !== "cancelado") {
      setFormError("No es posible cambiar el estado del proyecto sin una cotización aprobada. Solo puedes cancelarlo.");
      return;
    }
    if (!editTarget) {
      setForm((prev) => ({ ...prev, estado: nextEstado }));
      return;
    }
    if (nextEstado === form.estado) return;

    if (nextEstado === "entregado") {
      try {
        const hasApprovedPayment = await hasApprovedPaymentForProject(editTarget.id);
        if (!hasApprovedPayment) {
          setFormError("No puedes marcar como entregado sin un pago aprobado.");
          return;
        }
      } catch (paymentCheckErr) {
        setFormError(paymentCheckErr?.message || "No se pudo validar el pago del proyecto.");
        return;
      }
      setForm((prev) => ({ ...prev, estado: nextEstado }));
      return;
    }

    if (nextEstado === "terminado") {
      setStateConfirm({
        title: "Confirmar estado terminado",
        message: "¿Confirmas que deseas marcar este proyecto como <strong>terminado</strong>?",
        confirmLabel: "Marcar terminado",
        confirmColor: C_BLUE,
        nextEstado,
      });
      return;
    }

    if (nextEstado === "cancelado") {
      setStateConfirm({
        title: "Confirmar cancelación",
        message: "¿Confirmas que deseas marcar este proyecto como <strong>cancelado</strong>?",
        confirmLabel: "Cancelar proyecto",
        confirmColor: C_RED,
        nextEstado,
      });
      return;
    }

    if (nextEstado === "en_progreso") {
      const cotizacion = editTarget?.cotizaciones?.find(c => c.estado === "aprobada");
      if (!cotizacion) {
        setFormError("No puedes mover a En progreso sin una cotización aprobada por el cliente.");
        return;
      }
    }
    setForm((prev) => ({ ...prev, estado: nextEstado }));
  };



  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <ModuleHeader
        title="Proyectos"
        count={filtered.length}
        countLabel="proyectos activos"
        darkMode={darkMode}
        action={isAdmin && <BtnAccent onClick={openCreate} color={C_RED}>+ Nuevo Proyecto</BtnAccent>}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1"><Input darkMode={darkMode} icon="search" placeholder="Buscar por título, cliente o placas…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      </div>

      {/* Stats strip */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-4 no-scrollbar pr-4">
        <Card key="todos" darkMode={darkMode}
          className={`px-2 py-2.5 text-center cursor-pointer transition-all hover:scale-[1.02] flex-1 min-w-[85px] max-w-[160px] flex flex-col justify-center items-center ${filterEstado === "todos" ? (darkMode ? "ring-2 ring-blue-500 bg-blue-500/10" : "ring-2 ring-blue-500 bg-blue-50") : ""}`}
          onClick={() => setFilterEstado("todos")}
        >
          <p className={`text-base font-bold ${t}`}>{proyectos.filter(p => ESTADOS_ACTIVOS.includes(p.estado)).length}</p>
          <p className={`text-[10px] uppercase tracking-wider font-semibold ${st} mt-1`}>Activos</p>
        </Card>

        {ESTADOS_ACTIVOS.map((e) => {
          const count = proyectos.filter((p) => p.estado === e).length;
          const isActive = filterEstado === e;
          const badgeColors = estadoBadge(e, darkMode).split(" ")[1];
          return (
            <Card key={e} darkMode={darkMode}
              className={`px-2 py-2.5 text-center cursor-pointer transition-all hover:scale-[1.02] flex-1 min-w-[85px] max-w-[160px] flex flex-col justify-center items-center ${isActive ? (darkMode ? "ring-2 ring-blue-500 bg-blue-500/10" : "ring-2 ring-blue-500 bg-blue-50") : ""}`}
              onClick={() => setFilterEstado(e === filterEstado ? "todos" : e)}
            >
              <p className={`text-base font-bold ${badgeColors}`}>{count}</p>
              <p className={`text-[9px] uppercase tracking-wider font-semibold ${st} mt-1 truncate w-full px-1`}>{e.replace(/_/g, " ")}</p>
            </Card>
          );
        })}

        <Card key="archivados" darkMode={darkMode}
          className={`px-2 py-2.5 text-center cursor-pointer transition-all hover:scale-[1.02] flex-1 min-w-[85px] max-w-[160px] flex flex-col justify-center items-center ${filterEstado === "archivados" ? (darkMode ? "ring-2 ring-blue-500 bg-blue-500/10" : "ring-2 ring-blue-500 bg-blue-50") : ""}`}
          onClick={() => setFilterEstado(filterEstado === "archivados" ? "todos" : "archivados")}
        >
          <p className={`text-base font-bold ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>{proyectos.filter(p => ESTADOS_INACTIVOS.includes(p.estado)).length}</p>
          <p className={`text-[9px] uppercase tracking-wider font-semibold ${st} mt-1`}>Archivados</p>
        </Card>
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
                      <td className={`px-5 py-3 font-medium ${t} max-w-[160px] truncate cursor-pointer`} onClick={() => setDetalle(p)}>
                        <div className="flex items-center gap-1">
                          {p.bloqueado && <LucideIcon name="lock" className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                          <span className="truncate">{p.titulo}</span>
                        </div>
                      </td>
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
                    <p className={`font-medium ${t} flex items-center gap-1`}>
                      {p.bloqueado && <LucideIcon name="lock" className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                      {p.titulo}
                    </p>
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
          <Field label="Título del Proyecto" required darkMode={darkMode}><Input darkMode={darkMode} value={form.titulo} onChange={(e) => setForm({...form, titulo: normalizeUI(e.target.value)})} placeholder="DIAGNOSTICO GENERAL" /></Field>
          <Field label="Descripción" darkMode={darkMode}><Textarea darkMode={darkMode} rows={3} value={form.descripcion} onChange={(e) => setForm({...form, descripcion: e.target.value})} placeholder="Detalles del servicio…" /></Field>
          <Field label="Cliente" required darkMode={darkMode}>
            <Select darkMode={darkMode} value={form.cliente_id} onChange={(e) => setForm({...form, cliente_id: e.target.value, vehiculo_id: ""})}>
              <option value="">Seleccionar cliente…</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
          </Field>
          <Field label="Vehículo" required darkMode={darkMode}>
            <Select darkMode={darkMode} value={form.vehiculo_id} onChange={(e) => setForm({...form, vehiculo_id: e.target.value, cita_id: ""})} disabled={!form.cliente_id}>
              <option value="">{form.cliente_id ? "Seleccionar vehículo…" : "Primero selecciona un cliente"}</option>
              {filteredVehiculos.map((v) => <option key={v.id} value={v.id}>{v.marca} {v.modelo} · {v.placas}</option>)}
            </Select>
          </Field>

          {(() => {
            const citasFiltradas = citas.filter(
              (ci) => ci.cliente_id === form.cliente_id &&
                      (!form.vehiculo_id || ci.vehiculo_id === form.vehiculo_id) &&
                      // Excluir citas ya vinculadas a otro proyecto (permitir la del proyecto actual en edición)
                      (!ci.proyectos || ci.proyectos.length === 0 || (editTarget && ci.proyectos.some(p => p.id === editTarget.id)))
            );
            return (
              <Field label="Cita Vinculada (opcional)" darkMode={darkMode}>
                <Select
                  darkMode={darkMode}
                  value={form.cita_id}
                  onChange={(e) => setForm({ ...form, cita_id: e.target.value })}
                  disabled={!form.cliente_id}
                >
                  <option value="">Sin cita asociada</option>
                  {citasFiltradas.map((ci) => (
                    <option key={ci.id} value={ci.id}>
                      {formatDateTimeWorkshop(ci.fecha_hora)} — {ci.motivo || "Sin motivo"}
                    </option>
                  ))}
                </Select>
                {form.cita_id && (
                  <p className={`mt-1 text-xs ${darkMode ? "text-amber-400" : "text-amber-600"}`}>
                    Al guardar, la cita pasará a estado <strong>confirmada</strong>.
                  </p>
                )}
              </Field>
            );
          })()}

          <Field label="Mecánico Asignado" darkMode={darkMode}>
            <Select darkMode={darkMode} value={form.mecanico_id} onChange={(e) => setForm({...form, mecanico_id: e.target.value})}>
              <option value="">Sin asignar</option>
              {empleados.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </Select>
          </Field>
          
          {isAdmin && editTarget &&(
            <Field label="Estado" darkMode={darkMode}>
              <Select darkMode={darkMode} value={form.estado} onChange={(e) => handleAdminEstadoChange(e.target.value)}>
                {adminManualStatusOptions.map((e) => <option key={e} value={e}>{e.replace(/_/g, " ")}</option>)}
              </Select>
            </Field>
          )}
          
          {isMecanico && editTarget && (
            <div className={`rounded-lg border p-3 ${darkMode ? "border-zinc-700 bg-zinc-900/30" : "border-gray-200 bg-gray-50"}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>Estado Actual</p>
              <p className={`mt-1 text-sm ${darkMode ? "text-zinc-200" : "text-gray-700"}`}>{estadoLabel(form.estado)}</p>
              {form.estado !== "terminado" && form.estado !== "entregado" && form.estado !== "cancelado" && (
                <p className={`mt-2 text-xs ${darkMode ? "text-amber-400" : "text-amber-600"}`}>
                  Solo puedes cambiar a <strong>Terminado</strong> cuando completes el trabajo.
                </p>
              )}
            </div>
          )}

            {/* ── Diagnóstico inicial ───────────────────────────────────────── */}
            <div className={`rounded-lg border p-3 ${darkMode ? "border-zinc-700 bg-zinc-900/30" : "border-gray-200 bg-gray-50"}`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
                  Diagnóstico Inicial
                </p>
                {existingDiag && !editandoDiag && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${darkMode ? "bg-emerald-900/40 text-emerald-300 border-emerald-700" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                    <LucideIcon name="check" className="w-2.5 h-2.5" /> Registrado
                  </span>
                )}
              </div>
              {existingDiag && !editandoDiag ? (
                <div className="flex flex-col gap-2">
                  <div className={`rounded-md border px-3 py-2 text-sm ${darkMode ? "border-zinc-700 bg-[#21212b] text-zinc-300" : "border-gray-200 bg-white text-gray-700"}`}>
                    <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ...`}>Tipo de servicio</p>
                    <p className="capitalize">{existingDiag.tipo_operacion || "—"}</p>
                    <p className={`text-[10px] font-semibold uppercase tracking-widest mt-2 mb-1 ...`}>Descripción</p>
                    <p>{existingDiag.sintomas || "—"}</p>
                    {existingDiag.tipo_operacion === "correctivo" && existingDiag.causa_raiz && <><p className={`text-[10px] font-semibold uppercase tracking-widest mt-2 mb-1 ${darkMode ? "text-zinc-500" : "text-gray-400"}`}>Causa del problema</p><p>{existingDiag.causa_raiz}</p></>}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setEditandoDiag(true); setDiagForm({ tipo_operacion: existingDiag.tipo_operacion || "preventivo", sintomas: existingDiag.sintomas || "", descripcion: existingDiag.descripcion || "", causa_raiz: existingDiag.causa_raiz || "" }); }}
                    className={`self-start text-xs px-3 py-1.5 rounded-md border ${darkMode ? "border-zinc-700 text-zinc-400 hover:text-zinc-200" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}>
                    Editar diagnóstico
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  
                  <Field label="Tipo de servicio" darkMode={darkMode}>
                      <Select darkMode={darkMode} value={diagForm.tipo_operacion} onChange={(e) => setDiagForm({...diagForm, tipo_operacion: e.target.value, causa_raiz: ""})}>
                      <option value="preventivo">Preventivo</option>
                      <option value="correctivo">Correctivo</option>
                      <option value="revision">Revisión</option>
                    </Select>
                  </Field>
                  <Field label="Descripción" darkMode={darkMode}>
                    <Textarea darkMode={darkMode} rows={2} value={diagForm.sintomas} onChange={(e) => setDiagForm({...diagForm, sintomas: e.target.value})} placeholder="Describe el diagnóstico inicial del vehículo…" />
                  </Field>
                  {diagForm.tipo_operacion === "correctivo" && (
                    <Field label="Posible Causa del problema" darkMode={darkMode}>
                      <Input darkMode={darkMode} value={diagForm.causa_raiz} onChange={(e) => setDiagForm({...diagForm, causa_raiz: e.target.value})} placeholder="Causa probable del problema…" />
                    </Field>
                  )}
                  {editandoDiag && (
                    <button
                      type="button"
                      onClick={() => { setEditandoDiag(false); setDiagError(""); }}
                      className={`self-start text-xs px-3 py-1.5 rounded-md border ${darkMode ? "border-zinc-700 text-zinc-400 hover:text-zinc-200" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}
                    >Cancelar edición</button>
                  )}
                  {diagError && <p className="text-xs" style={{ color: C_RED }}>{diagError}</p>}
                  <p className={`text-[11px] ${darkMode ? "text-zinc-500" : "text-gray-400"}`}>
                    El diagnóstico se guardará junto con el proyecto. Los campos de cotización están bloqueados hasta que haya un diagnóstico.
                  </p>
                </div>
              )}
            </div>

          {/* ── Cotización Inicial (bloqueada sin diagnóstico) ──────────────── */}
          {(() => {
            const diagListo = (existingDiag || diagForm.sintomas.trim());
            return (
          <div className={`rounded-lg border p-3 relative ${darkMode ? "border-zinc-700 bg-zinc-900/30" : "border-gray-200 bg-gray-50"}`}>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
              Cotización Inicial
            </p>
            {!diagListo && (
              <div className={`absolute inset-0 rounded-lg flex flex-col items-center justify-center gap-2 z-10 ${darkMode ? "bg-zinc-900/80" : "bg-gray-50/90"}`}>
                <LucideIcon name="lock" className="w-8 h-8 text-amber-500/50" />
                <p className={`text-xs font-medium text-center px-4 ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
                  Completa el diagnóstico inicial para habilitar la cotización
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Mano de Obra" darkMode={darkMode}>
                <Input
                  darkMode={darkMode}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.monto_mano_obra}
                  onChange={(e) => setForm({ ...form, monto_mano_obra: e.target.value })}
                  placeholder="0.00"
                />
              </Field>
              <div className="flex flex-col gap-1.5">
                <label className={`text-[10px] font-semibold uppercase tracking-widest ${darkMode ? "text-zinc-500" : "text-gray-400"}`}>
                  Refacciones
                </label>
                {refCart.length === 0 ? (
                  <button
                    type="button"
                    onClick={openRefPicker}
                    className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${darkMode ? "border-zinc-700 text-zinc-300 hover:border-zinc-500" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                  >
                    Agregar refacciones
                  </button>
                ) : (
                  <div className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 ${darkMode ? "border-zinc-700 text-zinc-100" : "border-gray-200 text-gray-700"}`}>
                    <span className="text-sm font-medium">${refCartTotal.toFixed(2)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={openRefPicker}
                        className={`text-xs px-2 py-1 rounded-md border ${darkMode ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800" : "border-gray-300 text-gray-600 hover:bg-gray-100"}`}
                      >
                        Modificar
                      </button>
                      <button
                        type="button"
                        onClick={clearRefCart}
                        className="w-7 h-7 rounded-full text-white text-sm leading-none"
                        style={{ backgroundColor: C_RED }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
              <p className={`text-sm ${darkMode ? "text-zinc-300" : "text-gray-700"}`}>
                Total estimado: <strong>${((Number(form.monto_mano_obra || 0) + Number(form.monto_refacc || 0)) || 0).toFixed(2)}</strong>
              </p>
            </div>
            {refPickerOpen && createPortal(
              <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-10 bg-black/60 anim-fadeIn" onClick={cancelRefPicker}>
                <div
                  className={`anim-fadeUp relative w-full max-w-5xl rounded-xl ${darkMode ? "bg-[#1e1e26] text-white" : "bg-white text-gray-800"}`}
                  style={{ boxShadow: darkMode ? "0 24px 64px rgba(0,0,0,0.6)" : "0 16px 48px rgba(0,0,0,0.15)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? "border-zinc-700/60" : "border-gray-200"}`}>
                    <h2 className="font-semibold text-base">Agregar refacciones</h2>
                    <button onClick={cancelRefPicker} className="text-zinc-400 hover:text-current transition-colors text-xl leading-none">×</button>
                  </div>
                  <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
                      <div>
                        <Input
                          darkMode={darkMode}
                          placeholder="Buscar refaccion por nombre o numero de parte..."
                          value={refSearch}
                          onChange={(e) => setRefSearch(e.target.value)}
                        />
                        <div className={`mt-3 divide-y ${darkMode ? "divide-zinc-800" : "divide-gray-100"}`}>
                          {refFiltered.length === 0 ? (
                            <div className={`py-6 text-center text-sm ${darkMode ? "text-zinc-500" : "text-gray-400"}`}>Sin resultados</div>
                          ) : (
                            refFiltered.map((r) => {
                              const enCarrito = (Array.isArray(refCartDraft) ? refCartDraft : []).find(i => i.id === r.id)?.cantidad || 0;
                              const sinStock = Number(r.stock || 0) <= 0;
                              const limiteAlcanzado = enCarrito >= Number(r.stock || 0);
                              return (
                                <div key={r.id} className={`py-2 flex items-center justify-between ${darkMode ? "hover:bg-[#25252f]" : "hover:bg-gray-50"}`}>
                                  <div>
                                    <p className={`text-sm font-medium ${darkMode ? "text-zinc-100" : "text-gray-800"}`}>{r.nombre}</p>
                                    <p className={`text-xs ${darkMode ? "text-zinc-500" : "text-gray-400"}`}>
                                      {r.numero_parte || "—"} · Stock: {r.stock ?? 0}
                                      {enCarrito > 0 && ` (${enCarrito} en carrito)`}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => addRefToDraft(r)}
                                    disabled={sinStock || limiteAlcanzado}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                                      ${darkMode ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                                  >
                                    {sinStock ? "Sin stock" : limiteAlcanzado ? "Límite" : "Agregar"}
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                      <div>
                        <p className={`text-sm font-semibold mb-2 ${darkMode ? "text-zinc-200" : "text-gray-700"}`}>Carrito</p>
                        {Array.isArray(refCartDraft) && refCartDraft.length > 0 ? (
                          <div className={`divide-y ${darkMode ? "divide-zinc-800" : "divide-gray-100"}`}>
                            {refCartDraft.map((item) => (
                              <div key={item.id} className="py-2 flex flex-col gap-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className={`text-sm font-medium ${darkMode ? "text-zinc-100" : "text-gray-800"}`}>{item.nombre}</p>
                                    <p className={`text-xs ${darkMode ? "text-zinc-500" : "text-gray-400"}`}>{item.numero_parte || "—"}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeRefDraftItem(item.id)}
                                    className={`text-xs px-2 py-1 rounded-md border ${darkMode ? "border-zinc-700 text-zinc-400 hover:text-red-300" : "border-gray-200 text-gray-500 hover:text-red-500"}`}
                                  >
                                    Quitar
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex flex-col gap-1">
                                    <span className={`text-[10px] font-semibold uppercase tracking-widest ${darkMode ? "text-zinc-500" : "text-gray-400"}`}>Cantidad</span>
                                    <Input
                                      darkMode={darkMode}
                                      type="number"
                                      min="1"
                                      step="1"
                                      max={getRefCartItemMaxCantidad(item)}
                                      value={item.cantidad}
                                      onChange={(e) => {
                                        const maxCantidad = getRefCartItemMaxCantidad(item);
                                        updateRefDraftItem(item.id, {
                                          cantidad: normalizeCantidadConStock(e.target.value, maxCantidad),
                                        });
                                      }}
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className={`text-[10px] font-semibold uppercase tracking-widest ${darkMode ? "text-zinc-500" : "text-gray-400"}`}>Precio</span>
                                    <Input
                                      darkMode={darkMode}
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={item.precio_unit}
                                      onChange={(e) => updateRefDraftItem(item.id, { precio_unit: e.target.value })}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className={`text-xs ${darkMode ? "text-zinc-500" : "text-gray-400"}`}>Agrega refacciones desde la lista.</p>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <span className={`text-xs ${darkMode ? "text-zinc-500" : "text-gray-400"}`}>Total</span>
                          <span className={`text-sm font-semibold ${darkMode ? "text-zinc-100" : "text-gray-800"}`}>
                            ${Array.isArray(refCartDraft)
                              ? refCartDraft.reduce((sum, item) => sum + Number(item.precio_unit || 0) * Number(item.cantidad || 0), 0).toFixed(2)
                              : "0.00"}
                          </span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={cancelRefPicker}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium border ${darkMode ? "border-zinc-700 text-zinc-400" : "border-gray-200 text-gray-500"}`}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={confirmRefPicker}
                            className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
                            style={{ backgroundColor: C_BLUE, boxShadow: `0 2px 8px ${C_BLUE}40` }}
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
          );
          })()}

          {/* Bloqueado oculto — se maneja automáticamente */}
          {/* <div className="flex items-center gap-3">
            <input type="checkbox" id="bloqueado" checked={form.bloqueado} onChange={(e) => setForm({...form, bloqueado: e.target.checked})} className="w-4 h-4" style={{ accentColor: C_BLUE }} />
            <label htmlFor="bloqueado" className={`text-sm ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>Bloqueado (entrega pendiente de pago)</label>
          </div> */}

          {/* ── Secciones solo en edición ── */}
          {editTarget && (<>

            {/* Observaciones */}
            <div className={`rounded-lg border p-3 ${darkMode ? "border-zinc-700 bg-zinc-900/30" : "border-gray-200 bg-gray-50"}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>Observaciones</p>
              {editTarget.observaciones && (
                <div className={`rounded-md border px-3 py-2 mb-2 text-sm ${darkMode ? "border-zinc-700 bg-[#21212b] text-zinc-300" : "border-gray-200 bg-white text-gray-700"}`}>
                  <p className="whitespace-pre-wrap">{editTarget.observaciones}</p>
                </div>
              )}
              <ObservacionesSection
                proyecto={editTarget}
                darkMode={darkMode}
                canUpload={isAdmin}
                session={session}
                onGuardado={(nuevoTexto) => setEditTarget(prev => ({ ...prev, observaciones: nuevoTexto }))}
              />
            </div>

            {/* Diagnóstico Final */}
            <div className={`rounded-lg border p-3 ${darkMode ? "border-zinc-700 bg-zinc-900/30" : "border-gray-200 bg-gray-50"}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>Diagnóstico Final</p>
              <DiagnosticoFinalSection
                proyecto={editTarget}
                darkMode={darkMode}
                session={session}
                canUpload={isAdmin}
                diagnosticoInicial={Array.isArray(editTarget.diagnosticos) ? editTarget.diagnosticos.find(d => d.tipo === "inicial") || null : null}
                diagnosticoFinal={Array.isArray(editTarget.diagnosticos) ? editTarget.diagnosticos.find(d => d.tipo === "final") || null : null}
              />
            </div>

            {/* Refacciones asignadas - solo consulta, el picker se abre desde "Cotizacion Inicial" */}
            <EditRefaccionesSection
              ref={editRefSeccionRef}
              proyecto={editTarget}
              darkMode={darkMode}
              session={session}
              refCatalog={refCatalog}
            />

            {/* Fotos */}
            <EditFotosSection
              proyecto={editTarget}
              darkMode={darkMode}
              session={session}
              canUpload={isAdmin}
            />

          </>)}


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

      <ConfirmModal
        open={!!stateConfirm}
        onClose={() => setStateConfirm(null)}
        title={stateConfirm?.title || "Confirmación"}
        message={stateConfirm?.message || "¿Deseas continuar?"}
        onConfirm={() => {
          const nextEstado = stateConfirm?.nextEstado;
          setStateConfirm(null);
          if (nextEstado) {
            setForm((prev) => ({ ...prev, estado: nextEstado }));
          }
        }}
        confirmLabel={stateConfirm?.confirmLabel || "Confirmar"}
        confirmColor={stateConfirm?.confirmColor || C_BLUE}
        darkMode={darkMode}
      />
      <ProyectoDetalleModal
        open={!!detalle} onClose={() => setDetalle(null)}
        proyecto={detalle} darkMode={darkMode}
        canUpload={false} session={session}
        onProjectUpdated={handleProyectoActualizado}
      />
    {entregadoError && (
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60">
        <div className={`w-full max-w-sm rounded-xl p-6 ${darkMode ? "bg-[#1e1e28]" : "bg-white"}`}
          style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.3)" }}>
          <h3 className={`font-semibold text-base mb-2 ${darkMode ? "text-zinc-100" : "text-gray-800"}`}>
            Acción no permitida
          </h3>
          <p className={`text-sm mb-4 ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
            {entregadoError}
          </p>
          <button
            onClick={() => setEntregadoError("")}
            className="w-full py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: C_BLUE }}
          >
            Entendido
          </button>
        </div>
      </div>
    )}  
    </div>
  );
};

// ─── Protected Route ──────────────────────────────────────────────────────────
const ProtectedRoute = ({ session, children }) => {
  if (!session) return <Navigate to="/login" replace />;
  return children;
};

// ─── User menu (top-right avatar + dropdown) ──────────────────────────────────
// UserMenuWithRef is used instead to handle click-outside properly.

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

// Componente Dropdown de Notificaciones
const NotificacionesDropdown = ({ session, darkMode, onNotificationClick }) => {
  const [open, setOpen, ref] = useClickOutside();
  const { notificaciones, unreadCount, refresh } = useUserNotifications(session);

  const handleMarkRead = async (id) => {
    if (!id) return;
    await supabase.from("notificaciones").update({ leida: true }).eq("id", id);
    refresh();
  };

  const handleMarkAllRead = async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    await supabase.from("notificaciones").update({ leida: true }).eq("usuario_id", userId).eq("leida", false);
    refresh();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg transition-colors"
        style={{ background: open ? (darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)") : "transparent" }}
      >
        <LucideIcon name="bell" className={`w-5 h-5 ${darkMode ? "text-zinc-400" : "text-gray-500"}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2" style={{ borderColor: darkMode ? "#12121a" : "#ffffff" }}></span>
        )}
      </button>

      {open && (
        <div
          className={`anim-slideDown absolute right-0 top-full mt-2 w-80 rounded-xl border z-50 overflow-hidden flex flex-col ${darkMode ? "bg-[#1e1e28] border-zinc-700" : "bg-white border-gray-200"}`}
          style={{ boxShadow: darkMode ? "0 12px 32px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.12)", maxHeight: "400px" }}
        >
          <div className={`px-4 py-3 border-b flex justify-between items-center ${darkMode ? "border-zinc-800" : "border-gray-100"}`}>
            <h3 className={`font-semibold text-sm ${darkMode ? "text-zinc-100" : "text-gray-800"}`}>Notificaciones</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-[10px] text-blue-500 hover:underline">Marcar leídas</button>
            )}
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {notificaciones.length === 0 ? (
              <p className={`text-xs text-center py-6 ${darkMode ? "text-zinc-500" : "text-gray-500"}`}>No tienes notificaciones</p>
            ) : (
              notificaciones.map(n => (
                <div
                  key={n.id}
                  onClick={() => {
                    handleMarkRead(n.id);
                    if (onNotificationClick) onNotificationClick(n);
                    setOpen(false);
                  }}
                  className={`p-3 rounded-lg flex flex-col gap-1 transition-colors cursor-pointer ${darkMode ? "hover:bg-zinc-800/50" : "hover:bg-gray-50"} ${!n.leida ? (darkMode ? "bg-zinc-800/80" : "bg-blue-50/80") : ""}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className={`text-xs font-semibold ${darkMode ? "text-zinc-200" : "text-gray-800"} ${!n.leida ? "font-bold" : ""}`}>{n.titulo}</p>
                    {!n.leida && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1"></span>}
                  </div>
                  <p className={`text-[11px] leading-relaxed ${darkMode ? "text-zinc-400" : "text-gray-600"}`}>{n.mensaje}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className={`text-[9px] ${darkMode ? "text-zinc-500" : "text-gray-400"}`}>{formatDateTimeWorkshop(n.created_at)}</p>
                    {!n.leida && (
                      <span className="text-[10px] text-blue-500 font-medium">Nueva</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Override UserMenu to use the ref properly
const UserMenuWithRef = ({ session, onLogout, darkMode, rolLabel }) => {
  const [open, setOpen, ref] = useClickOutside();
  const email = session?.user?.email || "";
  const displayName = session?.user?.user_metadata?.nombre || session?.user?.user_metadata?.name || "";
  const initials = (displayName || email).split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || email.slice(0, 2).toUpperCase();

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
        <span className={`text-xs font-medium hidden sm:block max-w-[140px] truncate ${darkMode ? "text-zinc-300" : "text-gray-600"}`}>{displayName || email}</span>
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
            {displayName && (
              <p className={`text-[11px] font-semibold ${darkMode ? "text-zinc-300" : "text-gray-800"} mt-1`}>{displayName}</p>
            )}
            <p className={`text-[10px] ${darkMode ? "text-zinc-500" : "text-gray-400"} mt-0.5`}>{rolLabel || "Usuario"}</p>
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

// ─── Shell compartido (topbar + sidebar) ─────────────────────────────────────

// ─── Sección Diagnóstico Inicial (usada en ProyectoDetalleModal) ──────────────
const DIAG_TIPOS_LABELS = { inicial: "Inicial", preventivo: "Preventivo", correctivo: "Correctivo", revision: "Revisión" };

const DiagnosticoInicialSection = ({ proyecto, darkMode, session, canUpload, diagnosticoInicial: diagProp, formatoBasico = false }) => {
  const [diag,       setDiag]       = useState(diagProp || null);
  const [editMode,   setEditMode]   = useState(false);
  const [form,       setForm]       = useState({ tipo: "inicial", sintomas: "", descripcion: "", causa_raiz: "" });
  const [saving,     setSaving]     = useState(false);
  const [err,        setErr]        = useState("");

  // Sync if parent re-opens modal with different project
  useEffect(() => {
    setDiag(diagProp || null);
    setEditMode(false);
    setErr("");
  }, [proyecto?.id, diagProp]);

  const t  = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";

  const startEdit = () => {
    setForm({
      tipo:       diag?.tipo       || "inicial",
      sintomas:   diag?.sintomas   || "",
      descripcion:  formatoBasico ? "" : (diag?.descripcion || ""),
      causa_raiz: diag?.causa_raiz || "",
    });
    setEditMode(true);
    setErr("");
  };

  const handleSaveDiag = async () => {
    if (!form.sintomas.trim()) { setErr("Los síntomas son obligatorios."); return; }
    setSaving(true); setErr("");
    try {
      // Resolver mecanico_id del usuario autenticado
      let mecId = proyecto?.mecanico_id || null;
      if (session?.user?.email) {
        const { data: emp } = await supabase.from("empleados").select("id").eq("correo", session.user.email).maybeSingle();
        if (emp?.id) mecId = emp.id;
      }
      if (!mecId) { setErr("No se encontró el mecánico asociado. Asegúrate de que el proyecto tenga un mecánico asignado."); setSaving(false); return; }

      const payload = {
        tipo:       form.tipo,
        sintomas:   form.sintomas.trim()   || null,
        descripcion:  formatoBasico ? null : (form.descripcion.trim() || null),
        causa_raiz: form.causa_raiz.trim() || null,
      };

      if (diag?.id) {
        const { error } = await supabase.from("diagnosticos").update(payload).eq("id", diag.id);
        if (error) throw error;
        setDiag({ ...diag, ...payload });
      } else {
        const { data, error } = await supabase.from("diagnosticos")
          .insert([{ proyecto_id: proyecto.id, mecanico_id: mecId, ...payload }])
          .select("id, tipo, sintomas, descripcion, causa_raiz, created_at")
          .single();
        if (error) throw error;
        setDiag(data);
      }
      setEditMode(false);
    } catch (e) {
      setErr(e?.message || "Error al guardar diagnóstico.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Diagnóstico inicial</p>
        {diag && !editMode && canUpload && (
          <button onClick={startEdit} className={`text-[10px] px-2 py-1 rounded border ${darkMode ? "border-zinc-700 text-zinc-400 hover:text-zinc-200" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}>
            Editar
          </button>
        )}
      </div>

      {editMode ? (
        <div className={`rounded-lg border p-3 flex flex-col gap-3 ${darkMode ? "border-zinc-700 bg-[#21212b]" : "border-gray-200 bg-gray-50"}`}>
          <div>
            <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => setForm({...form, tipo: e.target.value})}
              className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none ${darkMode ? "bg-[#2a2a35] border-zinc-700 text-zinc-100" : "bg-white border-gray-200 text-gray-800"}`}
            >
              {Object.entries(DIAG_TIPOS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Diagnóstico inicial *</label>
            <textarea
              rows={3}
              value={form.sintomas}
              onChange={(e) => setForm({...form, sintomas: e.target.value})}
              placeholder="Describe el diagnóstico inicial del vehículo…"
              className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm resize-none outline-none ${darkMode ? "bg-[#2a2a35] border-zinc-700 text-zinc-100" : "bg-white border-gray-200 text-gray-800"}`}
            />
          </div>
          {!formatoBasico && (
          <div>
            <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>descripcion</label>
            <textarea
              rows={2}
              value={form.descripcion}
              onChange={(e) => setForm({...form, descripcion: e.target.value})}
              placeholder="Observaciones técnicas al recibir el vehículo…"
              className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm resize-none outline-none ${darkMode ? "bg-[#2a2a35] border-zinc-700 text-zinc-100" : "bg-white border-gray-200 text-gray-800"}`}
            />
          </div>
          )}
          <div>
            <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Causa del problema</label>
            <input
              type="text"
              value={form.causa_raiz}
              onChange={(e) => setForm({...form, causa_raiz: e.target.value})}
              placeholder="Causa probable del problema…"
              className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none ${darkMode ? "bg-[#2a2a35] border-zinc-700 text-zinc-100" : "bg-white border-gray-200 text-gray-800"}`}
            />
          </div>
          {err && <p className="text-xs text-red-500">{err}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => { setEditMode(false); setErr(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border ${darkMode ? "border-zinc-700 text-zinc-400" : "border-gray-200 text-gray-500"}`}
            >Cancelar</button>
            <button
              onClick={handleSaveDiag}
              disabled={saving}
              className="flex-1 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: C_BLUE }}
            >{saving ? "Guardando…" : "Guardar diagnóstico"}</button>
          </div>
        </div>
      ) : diag ? (
        <div className={`rounded-lg border px-3 py-2 ${darkMode ? "border-zinc-700 bg-[#21212b]" : "border-gray-200 bg-gray-50"}`}>
          <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${st}`}>{DIAG_TIPOS_LABELS[diag.tipo] || diag.tipo}</p>
          <p className={`text-sm font-medium ${t}`}>{diag.sintomas || "Sin contenido"}</p>
          {!formatoBasico && diag.descripcion && <p className={`text-xs mt-1.5 ${st}`}><span className="font-semibold">descripcion:</span> {diag.descripcion}</p>}
          {diag.causa_raiz && <p className={`text-xs mt-1 ${st}`}><span className="font-semibold">Causa:</span> {diag.causa_raiz}</p>}
          {diag.empleados?.nombre && <p className={`text-[11px] mt-2 ${st}`}>Registrado por {diag.empleados.nombre}</p>}
        </div>
      ) : canUpload ? (
        <div>
          <p className={`text-xs mb-2 ${st}`}>Aún no hay diagnóstico inicial registrado.</p>
          <button
            onClick={startEdit}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-white"
            style={{ backgroundColor: C_BLUE }}
          >+ Agregar diagnóstico inicial</button>
        </div>
      ) : (
        <p className={`text-xs ${st}`}>Aún no hay diagnóstico inicial registrado.</p>
      )}
    </div>
  );
};
  const ObservacionesSection = ({ proyecto, darkMode, canUpload, session, onGuardado }) => {
    const valorGuardado = useRef(proyecto.observaciones || "");
    const [texto, setTexto]   = useState(valorGuardado.current);
    const [saving, setSaving] = useState(false);
    const [err, setErr]       = useState("");
    const t  = darkMode ? "text-zinc-100" : "text-gray-800";
    const st = darkMode ? "text-zinc-500" : "text-gray-400";

    useEffect(() => {
      valorGuardado.current = proyecto.observaciones || "";
      setTexto(proyecto.observaciones || "");
    }, [proyecto?.id, proyecto?.observaciones]);

    const haycambios = texto !== valorGuardado.current;

    const handleGuardar = async () => {
      setSaving(true); setErr("");
      try {
        const { error } = await supabase.from("proyectos")
          .update({ observaciones: texto.trim(), updated_at: new Date().toISOString() })
          .eq("id", proyecto.id);
        if (error) throw error;
        valorGuardado.current = texto.trim();
        if (onGuardado) onGuardado(texto.trim());
      } catch (e) {
        setErr(e?.message || "Error al guardar.");
      } finally {
        setSaving(false);
      }
    };

    return (
      <div>
        <p className={`text-[10px] font-semibold uppercase tracking-widest ${st} mb-2`}>Observaciones</p>
        {canUpload ? (
          <div className="flex flex-col gap-2">
            <textarea
              rows={3}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Observaciones del proyecto…"
              className={`w-full px-3 py-2 rounded-lg border text-sm resize-none outline-none focus:ring-2 focus:ring-sky-500 ${darkMode ? "bg-[#2a2a35] border-zinc-700 text-zinc-100" : "bg-white border-gray-200 text-gray-800"}`}
            />
            {err && <p className="text-xs text-red-500">{err}</p>}
            <button
              onClick={handleGuardar}
              disabled={saving || !haycambios}
              className="self-start px-3 py-1.5 rounded-md text-xs font-medium text-white disabled:opacity-40"
              style={{ backgroundColor: C_BLUE }}
            >{saving ? "Guardando…" : "Guardar observación"}</button>
          </div>
        ) : (
          texto
            ? <div className={`rounded-lg border px-3 py-2 ${darkMode ? "border-zinc-700 bg-[#21212b]" : "border-gray-200 bg-gray-50"}`}>
                <p className={`text-sm whitespace-pre-wrap ${t}`}>{texto}</p>
              </div>
            : <p className={`text-xs ${st}`}>Sin observaciones.</p>
        )}
      </div>
    );
  };
  const CotizacionDetalleSection = ({ proyecto, darkMode, session, canUpload, onActualizado }) => {
    const cotizacion = Array.isArray(proyecto.cotizaciones) && proyecto.cotizaciones.length > 0
      ? proyecto.cotizaciones.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      : null;
    const [manoObra, setManoObra] = useState(cotizacion?.monto_mano_obra ?? "");
    const [saving, setSaving]     = useState(false);
    const [err, setErr]           = useState("");
    const t  = darkMode ? "text-zinc-100" : "text-gray-800";
    const st = darkMode ? "text-zinc-500" : "text-gray-400";

    useEffect(() => {
      setManoObra(cotizacion?.monto_mano_obra ?? "");
    }, [proyecto?.id, cotizacion?.id]);

    const handleGuardar = async () => {
      const monto = Number(manoObra);
      if (!Number.isFinite(monto) || monto < 0) { setErr("Monto inválido."); return; }
      setSaving(true); setErr("");
      try {
        if (cotizacion?.id) {
          const { error } = await supabase.from("cotizaciones")
            .update({ monto_mano_obra: monto, updated_at: new Date().toISOString() })
            .eq("id", cotizacion.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("cotizaciones")
            .insert([{ proyecto_id: proyecto.id, monto_mano_obra: monto, monto_refacc: 0, estado: "pendiente" }]);
          if (error) throw error;
          // Cambiar estado del proyecto a pendiente_aprobacion
          await supabase.from("proyectos")
            .update({ estado: "pendiente_aprobacion", updated_at: new Date().toISOString() })
            .eq("id", proyecto.id);
          if (onActualizado) onActualizado({ id: proyecto.id, estado: "pendiente_aprobacion" });
        }
      } catch (e) {
        setErr(e?.message || "Error al guardar cotización.");
      } finally {
        setSaving(false);
      }
    };

    return (
      <div>
        <p className={`text-[10px] font-semibold uppercase tracking-widest ${st} mb-2`}>Cotización inicial</p>
        {cotizacion ? (
          <div className={`rounded-lg border px-3 py-2 mb-3 ${darkMode ? "border-zinc-700 bg-[#21212b]" : "border-gray-200 bg-gray-50"}`}>
            <div className="flex justify-between items-center">
              <p className={`text-xs ${st}`}>Mano de obra</p>
              <p className={`text-sm font-semibold ${t}`}>${Number(cotizacion.monto_mano_obra || 0).toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-center mt-1">
              <p className={`text-xs ${st}`}>Refacciones</p>
              <p className={`text-sm font-semibold ${t}`}>${Number(cotizacion.monto_refacc || 0).toFixed(2)}</p>
            </div>
            <div className={`flex justify-between items-center mt-2 pt-2 border-t ${darkMode ? "border-zinc-700" : "border-gray-200"}`}>
              <p className={`text-xs font-semibold ${t}`}>Total</p>
              <p className={`text-sm font-bold ${t}`}>${Number(cotizacion.monto_total || 0).toFixed(2)}</p>
            </div>
            <p className={`text-[10px] mt-2 ${st} capitalize`}>Estado: {cotizacion.estado?.replace(/_/g, " ")}</p>
          </div>
        ) : canUpload ? (
          <div className="flex flex-col gap-2 mb-2">
            <p className={`text-xs ${st}`}>No hay cotización registrada. Agrega una:</p>
            <Field label="Mano de obra" darkMode={darkMode}>
              <Input darkMode={darkMode} type="number" min="0" step="0.01" value={manoObra}
                onChange={(e) => setManoObra(e.target.value)} placeholder="0.00" />
            </Field>
            {err && <p className="text-xs text-red-500">{err}</p>}
            <button onClick={handleGuardar} disabled={saving}
              className="self-start px-3 py-1.5 rounded-md text-xs font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: C_BLUE }}
            >{saving ? "Guardando…" : "Crear cotización"}</button>
          </div>
        ) : (
          <p className={`text-xs ${st}`}>Sin cotización registrada.</p>
        )}
      </div>
    );
  };  
  const DiagnosticoFinalSection = ({ proyecto, darkMode, session, canUpload, diagnosticoInicial, diagnosticoFinal: diagFinalProp }) => {
    const [diag,     setDiag]     = useState(diagFinalProp || null);
    const [editMode, setEditMode] = useState(false);
    const [form,     setForm]     = useState({ tipo_operacion: "preventivo", sintomas: "", causa_raiz: "" });
    const [saving,   setSaving]   = useState(false);
    const [err,      setErr]      = useState("");
    const t  = darkMode ? "text-zinc-100" : "text-gray-800";
    const st = darkMode ? "text-zinc-500" : "text-gray-400";

    useEffect(() => {
      setDiag(diagFinalProp || null);
      setEditMode(false);
    }, [proyecto?.id, diagFinalProp]);

    const usarIgualQueInicial = () => {
      if (!diagnosticoInicial) return;
      setForm({
        tipo_operacion: diagnosticoInicial.tipo_operacion || "preventivo",
        sintomas: diagnosticoInicial.sintomas || "",
        causa_raiz: diagnosticoInicial.causa_raiz || "",
      });
    };

    const handleGuardar = async () => {
      if (!form.sintomas.trim()) { setErr("La descripción es obligatoria."); return; }
      setSaving(true); setErr("");
      try {
        let mecId = proyecto?.mecanico_id || null;
        if (session?.user?.email) {
          const { data: emp } = await supabase.from("empleados").select("id").eq("correo", session.user.email).maybeSingle();
          if (emp?.id) mecId = emp.id;
        }
        if (!mecId) { setErr("No se encontró mecánico asignado."); setSaving(false); return; }

        const payload = {
          tipo: "final",
          tipo_operacion: form.tipo_operacion,
          sintomas: form.sintomas.trim(),
          causa_raiz: form.tipo_operacion === "correctivo" ? (form.causa_raiz.trim() || null) : null,
        };

        if (diag?.id) {
          const { error } = await supabase.from("diagnosticos").update(payload).eq("id", diag.id);
          if (error) throw error;
          setDiag({ ...diag, ...payload });
        } else {
          const { data, error } = await supabase.from("diagnosticos")
            .insert([{ proyecto_id: proyecto.id, mecanico_id: mecId, ...payload }])
            .select("id, tipo, tipo_operacion, sintomas, causa_raiz, created_at")
            .single();
          if (error) throw error;
          setDiag(data);
        }
        setEditMode(false);
      } catch (e) {
        setErr(e?.message || "Error al guardar.");
      } finally {
        setSaving(false);
      }
    };
    const handleSinCambios = async () => {
      if (!diagnosticoInicial) return;
      setSaving(true); setErr("");
      try {
        let mecId = proyecto?.mecanico_id || null;
        if (session?.user?.email) {
          const { data: emp } = await supabase.from("empleados").select("id").eq("correo", session.user.email).maybeSingle();
          if (emp?.id) mecId = emp.id;
        }
        if (!mecId) { setErr("No se encontró mecánico asignado."); setSaving(false); return; }

        const payload = {
          proyecto_id: proyecto.id,
          mecanico_id: mecId,
          tipo: "final",
          tipo_operacion: diagnosticoInicial.tipo_operacion,
          sintomas: diagnosticoInicial.sintomas,
          descripcion: diagnosticoInicial.descripcion,
          causa_raiz: diagnosticoInicial.causa_raiz,
        };

        const { data, error } = await supabase
          .from("diagnosticos")
          .insert([payload])
          .select("id, tipo, tipo_operacion, sintomas, descripcion, causa_raiz, created_at")
          .single();
        if (error) throw error;
        setDiag(data);
      } catch (e) {
        setErr(e?.message || "Error al guardar.");
      } finally {
        setSaving(false);
      }
    };
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Diagnóstico final</p>
          {diag && !editMode && canUpload && (
            <button onClick={() => { setForm({ tipo_operacion: diag.tipo_operacion || "preventivo", sintomas: diag.sintomas || "", causa_raiz: diag.causa_raiz || "" }); setEditMode(true); }}
              className={`text-[10px] px-2 py-1 rounded border ${darkMode ? "border-zinc-700 text-zinc-400 hover:text-zinc-200" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}>
              Editar
            </button>
          )}
        </div>

        {editMode ? (
          <div className={`rounded-lg border p-3 flex flex-col gap-3 ${darkMode ? "border-zinc-700 bg-[#21212b]" : "border-gray-200 bg-gray-50"}`}>
            {diagnosticoInicial && (
              <button type="button" onClick={usarIgualQueInicial}
                className={`self-start text-xs px-3 py-1.5 rounded-md border ${darkMode ? "border-zinc-700 text-zinc-400 hover:text-zinc-200" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}>
                ✓ Coincide con el diagnóstico inicial
              </button>
            )}
            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Tipo de servicio</label>
              <select value={form.tipo_operacion}
                onChange={(e) => setForm({...form, tipo_operacion: e.target.value, causa_raiz: ""})}
                className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none ${darkMode ? "bg-[#2a2a35] border-zinc-700 text-zinc-100" : "bg-white border-gray-200 text-gray-800"}`}>
                <option value="preventivo">Preventivo</option>
                <option value="correctivo">Correctivo</option>
                <option value="revision">Revisión</option>
              </select>
            </div>
            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Descripción *</label>
              <textarea rows={3} value={form.sintomas} onChange={(e) => setForm({...form, sintomas: e.target.value})}
                placeholder="Describe el estado final del vehículo…"
                className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm resize-none outline-none ${darkMode ? "bg-[#2a2a35] border-zinc-700 text-zinc-100" : "bg-white border-gray-200 text-gray-800"}`}
              />
            </div>
            {form.tipo_operacion === "correctivo" && (
              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Causa del problema</label>
                <input type="text" value={form.causa_raiz} onChange={(e) => setForm({...form, causa_raiz: e.target.value})}
                  placeholder="Causa identificada…"
                  className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm outline-none ${darkMode ? "bg-[#2a2a35] border-zinc-700 text-zinc-100" : "bg-white border-gray-200 text-gray-800"}`}
                />
              </div>
            )}
            {err && <p className="text-xs text-red-500">{err}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setEditMode(false); setErr(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border ${darkMode ? "border-zinc-700 text-zinc-400" : "border-gray-200 text-gray-500"}`}>
                Cancelar
              </button>
              <button onClick={handleGuardar} disabled={saving}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: C_BLUE }}>
                {saving ? "Guardando…" : "Guardar diagnóstico final"}
              </button>
            </div>
          </div>
        ) : diag ? (
          <div className={`rounded-lg border px-3 py-2 ${darkMode ? "border-zinc-700 bg-[#21212b]" : "border-gray-200 bg-gray-50"}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${st} capitalize`}>{diag.tipo_operacion || "—"}</p>
            <p className={`text-sm ${t}`}>{diag.sintomas || "—"}</p>
            {diag.tipo_operacion === "correctivo" && diag.causa_raiz && (
              <p className={`text-xs mt-1 ${st}`}><span className="font-semibold">Causa:</span> {diag.causa_raiz}</p>
            )}
          </div>
          ) : canUpload ? (
                <div>
                  <p className={`text-xs mb-2 ${st}`}>Aún no hay diagnóstico final registrado.</p>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setEditMode(true)}
                      className="px-3 py-1.5 rounded-md text-xs font-medium text-white"
                      style={{ backgroundColor: C_BLUE }}>
                      + Agregar diagnóstico final
                    </button>
                    {diagnosticoInicial && (
                      <button
                        onClick={handleSinCambios}
                        disabled={saving}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border disabled:opacity-50 ${darkMode ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                      >
                        No Hubo Cambios Respecto al Inicial
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className={`text-xs ${st}`}>Aún no hay diagnóstico final registrado.</p>
              )}
            </div>
          );
        };
// ─── Modal Detalle Proyecto (con galería y subida de fotos) ───────────────────
// ─── EditRefaccionesSection ───────────────────────────────────────────────────
// Sección de CONSULTA de refacciones asignadas al proyecto.
// Expone openPicker() via ref para que el padre (Cotización Inicial) lo llame.
const EditRefaccionesSection = React.forwardRef(function EditRefaccionesSection({ proyecto, darkMode, session, refCatalog }, ref) {
  const [refacciones,    setRefacciones]    = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [pickerOpen,     setPickerOpen]     = useState(false);
  const [draft,          setDraft]          = useState([]);
  const [refSearch,      setRefSearch]      = useState("");
  const [confirmOpen,    setConfirmOpen]    = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [err,            setErr]            = useState("");
  const t  = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";

  const fetchRefacciones = useCallback(async () => {
    if (!proyecto?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("proyecto_refacciones")
      .select("id, refaccion_id, cantidad, precio_unitario, fue_usada, refacciones(id, nombre, numero_parte, precio_venta, stock)")
      .eq("proyecto_id", proyecto.id);
    setRefacciones(data || []);
    setLoading(false);
  }, [proyecto?.id]);

  useEffect(() => { fetchRefacciones(); }, [fetchRefacciones]);

  // Expone openPicker() al padre via ref
  React.useImperativeHandle(ref, () => ({ openPicker: () => openPicker() }), []);

  const openPicker = () => {
    setDraft((refacciones || []).map(r => ({
      id: r.refaccion_id,
      nombre: r.refacciones?.nombre || r.refaccion_id,
      numero_parte: r.refacciones?.numero_parte || "",
      cantidad: r.cantidad,
      precio_unit: Number(r.precio_unitario || 0),
      stock: r.refacciones?.stock || 0,
    })));
    setRefSearch("");
    setErr("");
    setPickerOpen(true);
  };

  const addToDraft = (ref) => {
    setDraft(prev => {
      const existing = prev.find(i => i.id === ref.id);
      const baseQty = Number((refacciones || []).find((r) => r.refaccion_id === ref.id)?.cantidad || 0);
      const stockNow = Number(ref.stock || 0);
      const maxCantidad = Math.max(1, baseQty + Math.max(0, stockNow));
      if (existing) {
        if (Number(existing.cantidad || 0) >= maxCantidad) return prev;
        return prev.map(i => i.id === ref.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, { id: ref.id, nombre: ref.nombre, numero_parte: ref.numero_parte || "", cantidad: 1, precio_unit: Number(ref.precio_venta || 0), stock: ref.stock || 0 }];
    });
  };

  const updateDraft = (id, patch) => setDraft(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  const removeDraft = (id) => setDraft(prev => prev.filter(i => i.id !== id));

  const getDraftItemMaxCantidad = (item) => {
    const baseQty = Number((refacciones || []).find((r) => r.refaccion_id === item.id)?.cantidad || 0);
    const stockNow = Number((refCatalog || []).find((r) => r.id === item.id)?.stock ?? item.stock ?? 0);
    return Math.max(1, baseQty + Math.max(0, stockNow));
  };

  const normalizeCantidadConStock = (rawValue, maxCantidad) => {
    const parsed = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(parsed) || parsed < 1) return 1;
    return Math.min(parsed, Math.max(1, Number(maxCantidad || 1)));
  };

  // Helper: llama la edge function con manejo correcto de errores HTTP
  const callGestorInventario = async (body) => {
    const { data, error } = await supabase.functions.invoke("gestionar-inventario", { body });
    // supabase.functions.invoke puede devolver error nulo aunque el status sea 4xx/5xx
    // por eso también revisamos data.success
    if (error) throw new Error(error.message || "Error en gestionar-inventario");
    if (data && data.success === false) throw new Error(data.error || "Error al actualizar inventario");
    return data;
  };

  const handleGuardarCambios = async () => {
    setSaving(true); setErr("");
    setConfirmOpen(false);
    try {
      const anterior = refacciones || [];
      const anteriorMap = Object.fromEntries(anterior.map(r => [r.refaccion_id, r]));
      const nuevoMap    = Object.fromEntries(draft.map(r => [r.id, r]));

      const ventasPendientes = [];
      for (const r of draft) {
        const prev = anteriorMap[r.id];
        const cantPrev = Number(prev?.cantidad || 0);
        const cantNew = Number(r.cantidad || 0);
        if (cantNew > cantPrev) {
          ventasPendientes.push({ refaccion_id: r.id, cantidad: cantNew - cantPrev });
        }
      }

      if (ventasPendientes.length > 0) {
        const refIds = ventasPendientes.map((v) => v.refaccion_id);
        const { data: stockRows, error: stockError } = await supabase
          .from("refacciones")
          .select("id,nombre,stock")
          .in("id", refIds);
        if (stockError) throw new Error(stockError.message || "Error al validar stock.");

        const stockMap = new Map((stockRows || []).map((row) => [row.id, row]));
        const sinStock = ventasPendientes
          .map((v) => {
            const row = stockMap.get(v.refaccion_id);
            const disponible = Number(row?.stock || 0);
            return disponible < Number(v.cantidad || 0)
              ? { nombre: row?.nombre || "Refacción", requerido: Number(v.cantidad || 0), disponible }
              : null;
          })
          .filter(Boolean);

        if (sinStock.length > 0) {
          const detalle = sinStock
            .map((i) => `${i.nombre} (disp: ${i.disponible}, req: ${i.requerido})`)
            .join(", ");
          throw new Error(`Stock insuficiente para guardar cambios: ${detalle}.`);
        }
      }

      // ── 1. Refacciones ELIMINADAS → COMPRA (devolución al stock) + borrar de proyecto_refacciones
      for (const r of anterior) {
        if (!nuevoMap[r.refaccion_id]) {
          await callGestorInventario({
            tipo_operacion: "COMPRA",
            refaccion_id: r.refaccion_id,
            cantidad: Number(r.cantidad),
            precio_unit: Number(r.precio_unitario || 0),
            proyecto_id: proyecto.id,
          });
          const { error: delErr } = await supabase.from("proyecto_refacciones").update({ fue_usada: false }).eq("id", r.id);
          if (delErr) throw new Error("Error al eliminar refacción del proyecto: " + delErr.message);
        }
      }

      // ── 2. Refacciones NUEVAS → VENTA (salida de inventario) + insertar en proyecto_refacciones
      for (const r of draft) {
        if (!anteriorMap[r.id]) {
          await callGestorInventario({
            tipo_operacion: "VENTA",
            refaccion_id: r.id,
            cantidad: Number(r.cantidad),
            precio_unit: Number(r.precio_unit || 0),
            proyecto_id: proyecto.id,
          });
          const { error: insErr } = await supabase.from("proyecto_refacciones").insert([{
            proyecto_id: proyecto.id,
            refaccion_id: r.id,
            cantidad: Number(r.cantidad),
            precio_unitario: Number(r.precio_unit || 0),
            fue_usada: true,
          }]);
          if (insErr) throw new Error("Error al asignar refacción: " + insErr.message);
        } else {
          // ── 3. Refacciones EXISTENTES con cantidad o precio cambiado
          const prev = anteriorMap[r.id];
          const cantPrev = Number(prev.cantidad || 0);
          const cantNew  = Number(r.cantidad || 0);
          if (cantPrev !== cantNew) {
            const diff = cantNew - cantPrev;
            // diff > 0 → se piden más → VENTA (sale del stock)
            // diff < 0 → se devuelven → COMPRA (regresa al stock)
            await callGestorInventario({
              tipo_operacion: diff > 0 ? "VENTA" : "COMPRA",
              refaccion_id: r.id,
              cantidad: Math.abs(diff),
              precio_unit: Number(r.precio_unit || 0),
              proyecto_id: proyecto.id,
            });
          }
          if (cantPrev !== cantNew || Number(prev.precio_unitario) !== Number(r.precio_unit)) {
            const { error: updErr } = await supabase.from("proyecto_refacciones")
              .update({ cantidad: cantNew, precio_unitario: Number(r.precio_unit || 0) })
              .eq("id", prev.id);
            if (updErr) throw new Error("Error al actualizar refacción: " + updErr.message);
          }
        }
      }

      setPickerOpen(false);
      await fetchRefacciones();
    } catch (e) {
      setErr(e?.message || "Error al guardar cambios.");
    } finally {
      setSaving(false);
    }
  };

  const refFiltered = (refCatalog || []).filter(r =>
    r.nombre?.toLowerCase().includes(refSearch.toLowerCase()) ||
    r.numero_parte?.toLowerCase().includes(refSearch.toLowerCase())
  );

  const draftTotal = draft.reduce((s, i) => s + Number(i.precio_unit || 0) * Number(i.cantidad || 0), 0);

  // ─── Render: solo vista de consulta + picker (abierto desde fuera via openPicker) ───
  return (
    <div className={`rounded-lg border p-3 ${darkMode ? "border-zinc-700 bg-zinc-900/30" : "border-gray-200 bg-gray-50"}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>Refacciones Asignadas</p>
      {loading ? (
        <p className={`text-xs ${st}`}>Cargando…</p>
      ) : refacciones.length === 0 ? (
        <p className={`text-xs ${st}`}>No hay refacciones asignadas a este proyecto.</p>
      ) : (
        <div className={`rounded-md border divide-y ${darkMode ? "border-zinc-700 divide-zinc-700" : "border-gray-200 divide-gray-100"}`}>
          {refacciones.map(r => (
            <div key={r.id} className="px-3 py-2 flex justify-between items-center text-sm">
              <div>
                <p className={t}>{r.refacciones?.nombre || "—"}</p>
                <p className={`text-xs ${st}`}>Cant: {r.cantidad} · ${Number(r.precio_unitario || 0).toFixed(2)} c/u</p>
              </div>
              {!r.fue_usada && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${darkMode ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-gray-100 text-gray-400 border-gray-200"}`}>
                  No se necesitó
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {err && <p className="mt-1 text-xs text-red-500">{err}</p>}

      {/* Picker portal */}
      {pickerOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-10 bg-black/60" onClick={() => setPickerOpen(false)}>
          <div
            className={`relative w-full max-w-5xl rounded-xl ${darkMode ? "bg-[#1e1e26] text-white" : "bg-white text-gray-800"}`}
            style={{ boxShadow: darkMode ? "0 24px 64px rgba(0,0,0,0.6)" : "0 16px 48px rgba(0,0,0,0.15)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? "border-zinc-700/60" : "border-gray-200"}`}>
              <h2 className="font-semibold text-base">Modificar refacciones</h2>
              <button onClick={() => setPickerOpen(false)} className="text-zinc-400 hover:text-current text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
                <div>
                  <Input darkMode={darkMode} placeholder="Buscar refacción…" value={refSearch} onChange={e => setRefSearch(e.target.value)} />
                  <div className={`mt-3 divide-y ${darkMode ? "divide-zinc-800" : "divide-gray-100"}`}>
                    {refFiltered.map(r => (
                      <div key={r.id} className={`py-2 flex items-center justify-between ${darkMode ? "hover:bg-[#25252f]" : "hover:bg-gray-50"}`}>
                        <div>
                          <p className={`text-sm font-medium ${t}`}>{r.nombre}</p>
                          <p className={`text-xs ${st}`}>{r.numero_parte || "—"} · Stock: {r.stock}</p>
                        </div>
                        {(() => {
                          const currentQty = Number(draft.find((i) => i.id === r.id)?.cantidad || 0);
                          const baseQty = Number((refacciones || []).find((x) => x.refaccion_id === r.id)?.cantidad || 0);
                          const maxCantidad = Math.max(1, baseQty + Math.max(0, Number(r.stock || 0)));
                          const limiteAlcanzado = currentQty >= maxCantidad;
                          return (
                            <button
                              onClick={() => addToDraft(r)}
                              disabled={limiteAlcanzado}
                              className={`px-3 py-1.5 rounded-md text-xs font-medium border disabled:opacity-40 disabled:cursor-not-allowed ${darkMode ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                            >
                              {limiteAlcanzado ? "Límite" : "+ Añadir"}
                            </button>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className={`text-sm font-semibold mb-2 ${t}`}>Carrito</p>
                  {draft.length > 0 ? (
                    <div className={`divide-y ${darkMode ? "divide-zinc-800" : "divide-gray-100"}`}>
                      {draft.map(item => (
                        <div key={item.id} className="py-2 flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`text-sm font-medium ${t}`}>{item.nombre}</p>
                              <p className={`text-xs ${st}`}>{item.numero_parte || "—"}</p>
                            </div>
                            <button onClick={() => removeDraft(item.id)} className={`text-xs px-2 py-1 rounded-md border ${darkMode ? "border-zinc-700 text-zinc-400 hover:text-red-300" : "border-gray-200 text-gray-500 hover:text-red-500"}`}>Quitar</button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className={`text-[10px] font-semibold uppercase ${st}`}>Cantidad</span>
                              <Input
                                darkMode={darkMode}
                                type="number"
                                min="1"
                                max={getDraftItemMaxCantidad(item)}
                                value={item.cantidad}
                                onChange={e => {
                                  const maxCantidad = getDraftItemMaxCantidad(item);
                                  updateDraft(item.id, { cantidad: normalizeCantidadConStock(e.target.value, maxCantidad) });
                                }}
                              />
                            </div>
                            <div>
                              <span className={`text-[10px] font-semibold uppercase ${st}`}>Precio</span>
                              <Input darkMode={darkMode} type="number" min="0" step="0.01" value={item.precio_unit} onChange={e => updateDraft(item.id, { precio_unit: e.target.value })} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-xs ${st}`}>Agrega refacciones desde la lista.</p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs ${st}`}>Total</span>
                    <span className={`text-sm font-semibold ${t}`}>${draftTotal.toFixed(2)}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setPickerOpen(false)} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${darkMode ? "border-zinc-700 text-zinc-400" : "border-gray-200 text-gray-500"}`}>Cancelar</button>
                    <button onClick={() => setConfirmOpen(true)} disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: C_BLUE }}>
                      {saving ? "Guardando…" : "Guardar cambios"}
                    </button>
                  </div>
                  {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmación */}
      {confirmOpen && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60">
          <div className={`w-full max-w-sm rounded-xl p-6 ${darkMode ? "bg-[#1e1e28]" : "bg-white"}`} style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.3)" }}>
            <h3 className={`font-semibold text-base mb-2 ${darkMode ? "text-zinc-100" : "text-gray-800"}`}>¿Confirmar cambios?</h3>
            <p className={`text-sm mb-4 ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
              Los cambios en las refacciones afectarán el inventario. Las refacciones eliminadas regresarán al stock y las nuevas se descontarán.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmOpen(false)} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${darkMode ? "border-zinc-700 text-zinc-400" : "border-gray-200 text-gray-500"}`}>Cancelar</button>
              <button onClick={handleGuardarCambios} disabled={saving} className="flex-1 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: C_BLUE }}>
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
});

// ─── EditFotosSection ─────────────────────────────────────────────────────────
const EditFotosSection = ({ proyecto, darkMode, session, canUpload }) => {
  const [fotos,      setFotos]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [momento,    setMomento]    = useState("durante");
  const [lightbox,   setLightbox]   = useState(null);
  const [err,        setErr]        = useState("");
  const fileRef = useRef(null);
  const st = darkMode ? "text-zinc-500" : "text-gray-400";

  const fetchFotos = useCallback(async () => {
    if (!proyecto?.id) return;
    setLoading(true);
    const { data } = await supabase.from("fotografias").select("id,url,momento,descripcion,created_at").eq("proyecto_id", proyecto.id).order("created_at");
    setFotos(data || []);
    setLoading(false);
  }, [proyecto?.id]);

  useEffect(() => { fetchFotos(); }, [fetchFotos]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !proyecto?.id) return;
    setUploading(true); setErr("");
    try {
      // Resolver mecanico_id
      let mecId = proyecto?.mecanico_id || null;
      if (session?.user?.email && !mecId) {
        const { data: emp } = await supabase.from("empleados").select("id").eq("correo", session.user.email).maybeSingle();
        if (emp?.id) mecId = emp.id;
      }
      if (!mecId) { setErr("No se encontró mecánico asignado para subir fotos."); setUploading(false); return; }

      for (const file of files) {
        const ext  = file.name.split(".").pop();
        const path = `proyectos/${proyecto.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("fotografias").upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("fotografias").getPublicUrl(path);
        await supabase.from("fotografias").insert({ proyecto_id: proyecto.id, mecanico_id: mecId, momento, url: urlData.publicUrl });
      }
      await fetchFotos();
    } catch (e) {
      setErr(e?.message || "Error al subir fotos.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDeleteFoto = async (foto) => {
    try {
      // Extraer path del storage desde la URL pública
      const url = foto.url || "";
      const match = url.match(/fotografias\/(.+)$/);
      const path = match ? match[1] : null;
      await supabase.from("fotografias").delete().eq("id", foto.id);
      if (path) await supabase.storage.from("fotografias").remove([path]);
      await fetchFotos();
      if (lightbox === foto.url) setLightbox(null);
    } catch (e) {
      setErr(e?.message || "Error al eliminar foto.");
    }
  };

  const momentoGrupos = ["antes", "durante", "despues"];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-xs font-semibold uppercase tracking-wider ${st}`}>Fotografías {fotos.length > 0 && `(${fotos.length})`}</p>
        {canUpload && (
          <div className="flex items-center gap-2">
            {uploading && <span className={`text-xs ${st}`}>Subiendo…</span>}
            <select value={momento} onChange={e => setMomento(e.target.value)} disabled={uploading}
              className={`text-xs px-2 py-1.5 rounded-lg border outline-none ${darkMode ? "bg-[#2a2a35] border-zinc-700 text-zinc-300" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
              <option value="antes">Antes</option>
              <option value="durante">Durante</option>
              <option value="despues">Después</option>
            </select>
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-50" style={{ backgroundColor: C_BLUE, color: "white" }}>
              + Fotos
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleUpload} />
          </div>
        )}
      </div>
      {err && <p className="text-xs text-red-500 mb-2">{err}</p>}
      {loading ? <p className={`text-xs ${st}`}>Cargando…</p> : fotos.length === 0 ? (
        <p className={`text-xs ${st}`}>Aún no hay fotografías.</p>
      ) : (
        momentoGrupos.map(m => {
          const grupo = fotos.filter(f => f.momento === m);
          if (!grupo.length) return null;
          return (
            <div key={m} className="mb-3">
              <p className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${st} capitalize`}>{m === "despues" ? "Después" : m}</p>
              <div className="grid grid-cols-3 gap-2">
                {grupo.map(f => (
                  <div key={f.id} className="relative group">
                    <img src={f.url} alt="" onClick={() => setLightbox(f.url)}
                      className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity" />
                    {canUpload && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteFoto(f); }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        style={{ backgroundColor: C_RED }}
                        title="Eliminar foto"
                      >×</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
      {lightbox && createPortal(
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/90" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="rounded-xl object-contain" style={{ maxWidth: "85vw", maxHeight: "85vh" }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: C_RED }}>×</button>
        </div>,
        document.body
      )}
    </div>
  );
};

// ─── Modal Detalle Proyecto (con galería y subida de fotos) ───────────────────
const ProyectoDetalleModal = ({ open, onClose, proyecto, darkMode, canUpload = false, session, diagnosticoFormatoBasico = false, onProjectUpdated }) => {
  const [fotos,        setFotos]        = useState([]);
  const [loadingFotos, setLoadingFotos] = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [uploadError,  setUploadError]  = useState("");
  const [lightbox,     setLightbox]     = useState(null);
  const [refaccionesCotizacion, setRefaccionesCotizacion] = useState([]);
  const [citas, setCitas] = useState([]);
  const [estadoProyectoLocal,   setEstadoProyectoLocal]   = useState(proyecto?.estado || "activo");
  const [descripcionProyecto, setDescripcionProyecto] = useState(proyecto?.descripcion || "");
  const [descripcionError,    setDescripcionError]    = useState("");
  const [descripcionGuardando, setDescripcionGuardando] = useState(false);
  // ─── NUEVOS ESTADOS PARA REFACCIONES ───
  const [refaccionesAsignadas, setRefaccionesAsignadas] = useState([]);
  const [loadingRefacciones, setLoadingRefacciones] = useState(false);
  const [refaccionesStatus, setRefaccionesStatus] = useState("");
  const [refCatalog, setRefCatalog] = useState([]);
  const [refNuevaId, setRefNuevaId] = useState("");
  const [refNuevaCantidad, setRefNuevaCantidad] = useState("1");
  const [refSaveError, setRefSaveError] = useState("");
  const [addingRefaccion, setAddingRefaccion] = useState(false);
  const [momentoFoto, setMomentoFoto] = useState("durante");
  const fileRef = useRef(null);

  // ─── NUEVA FUNCIÓN PARA TRAER REFACCIONES DEL PROYECTO ───
  const fetchRefaccionesAsignadas = useCallback(async () => {
    if (!proyecto?.id) return;
    setLoadingRefacciones(true);
    const { data, error } = await supabase
      .from("proyecto_refacciones")
      .select("id, refaccion_id, cantidad, precio_unitario, fue_usada, refacciones(nombre, numero_parte, stock)")
      .eq("proyecto_id", proyecto.id);
    
    if (error) {
      setRefaccionesStatus("Error al cargar piezas.");
    } else {
      setRefaccionesAsignadas(data || []);
    }
    setLoadingRefacciones(false);
  }, [proyecto?.id]);

  
  const fetchRefaccionesCotizacion = useCallback(async () => {
    if (!proyecto?.id) return;
    const cotizacion = Array.isArray(proyecto.cotizaciones)
      ? [...proyecto.cotizaciones].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      : null;
    if (!cotizacion?.id) return;
    const { data } = await supabase
      .from("cotizacion_items")
      .select("id, cantidad, precio_unit, refacciones(id, nombre, numero_parte)")
      .eq("cotizacion_id", cotizacion.id)
      .eq("tipo", "refaccion");
    setRefaccionesCotizacion(data || []);
  }, [proyecto?.id, proyecto?.cotizaciones]);
  
    useEffect(() => {
      if (!open || !proyecto?.id) return;
      fetchRefaccionesAsignadas();
      fetchRefaccionesCotizacion();
    }, [open, proyecto?.id, fetchRefaccionesAsignadas, fetchRefaccionesCotizacion]);

  const fetchRefCatalog = useCallback(async () => {
    if (!proyecto?.id) return;
    const { data } = await supabase
      .from("refacciones")
      .select("id, nombre, numero_parte, precio_venta, stock")
      .eq("activo", true)
      .order("nombre");
    setRefCatalog(data || []);
  }, [proyecto?.id]);

  useEffect(() => {
    if (open && diagnosticoFormatoBasico && canUpload) {
      fetchRefCatalog();
      setRefSaveError("");
    }
  }, [open, diagnosticoFormatoBasico, canUpload, fetchRefCatalog]);

  const handleAgregarRefaccion = async () => {
    if (!proyecto?.id || !refNuevaId) {
      setRefSaveError("Selecciona una refacción.");
      return;
    }

    const cantidad = Number.parseInt(refNuevaCantidad, 10);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      setRefSaveError("La cantidad debe ser mayor a 0.");
      return;
    }

    const refSeleccionada = refCatalog.find((r) => r.id === refNuevaId);
    if (!refSeleccionada) {
      setRefSaveError("No se encontró la refacción seleccionada.");
      return;
    }

    if (Number(refSeleccionada.stock || 0) < cantidad) {
      setRefSaveError("No hay stock suficiente para esa cantidad.");
      return;
    }

    setAddingRefaccion(true);
    setRefSaveError("");

    try {
      const { data: existente, error: existenteErr } = await supabase
        .from("proyecto_refacciones")
        .select("id, cantidad")
        .eq("proyecto_id", proyecto.id)
        .eq("refaccion_id", refNuevaId)
        .maybeSingle();

      if (existenteErr) throw existenteErr;

      if (existente?.id) {
        const { error: updateErr } = await supabase
          .from("proyecto_refacciones")
          .update({
            cantidad: Number(existente.cantidad || 0) + cantidad,
            precio_unitario: Number(refSeleccionada.precio_venta || 0),
          })
          .eq("id", existente.id);

        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from("proyecto_refacciones")
          .insert({
            proyecto_id: proyecto.id,
            refaccion_id: refNuevaId,
            cantidad,
            precio_unitario: Number(refSeleccionada.precio_venta || 0),
            fue_usada: false,
          });

        if (insertErr) throw insertErr;
      }

      setRefNuevaId("");
      setRefNuevaCantidad("1");
      await fetchRefaccionesAsignadas();
    } catch (e) {
      setRefSaveError(e?.message || "No se pudo agregar la refacción.");
    } finally {
      setAddingRefaccion(false);
    }
  };

  // Función para cambiar el booleano fue_usada
  const toggleUsoRefaccion = async (id, actual) => {
    await supabase
      .from("proyecto_refacciones")
      .update({ fue_usada: !actual })
      .eq("id", id);
    fetchRefaccionesAsignadas();
  };

  

  const fetchFotos = useCallback(async () => {
    if (!proyecto?.id) return;
    setLoadingFotos(true);
    const { data, error } = await supabase
      .from("fotografias")
      .select("id, url, descripcion, momento, created_at")
      .eq("proyecto_id", proyecto.id)
      .order("created_at", { ascending: true });
    if (error) console.error("[fetchFotos] DB error:", error);
    console.log("[fetchFotos] rows:", data);
    setFotos(data || []);
    setLoadingFotos(false);
  }, [proyecto?.id]);

  useEffect(() => {
    if (open) fetchFotos();
    else { setFotos([]); setUploadError(""); setLightbox(null); }
  }, [open, fetchFotos]);

  useEffect(() => {
    if (!open || !proyecto) return;
    setDescripcionProyecto(proyecto.descripcion || "");
    setEstadoProyectoLocal(proyecto.estado || "activo");
    setDescripcionError("");
  }, [open, proyecto?.id, proyecto?.descripcion, proyecto?.estado]);

  useEffect(() => {
    if (!lightbox) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [lightbox]);

  const notifyClientNewPhotos = async () => {
    if (!proyecto?.id) return;
    try {
      let targetId = proyecto.clientes?.usuario_id;
      
      // Si no viene en el objeto, lo buscamos rápidamente
      if (!targetId) {
        const { data: pData } = await supabase
          .from("proyectos")
          .select("clientes(usuario_id)")
          .eq("id", proyecto.id)
          .maybeSingle();
        targetId = pData?.clientes?.usuario_id;
      }

      if (!targetId) return;

      await invokeEdgeFunction("enviar-notificacion", {
        body: {
          usuario_id: targetId,
          proyecto_id: proyecto.id,
          titulo: "Nuevas fotos de tu vehículo",
          mensaje: `Se han subido nuevas fotos del avance en tu proyecto "${proyecto.titulo}".`,
        },
        userToken: session?.access_token || "",
      });
    } catch (err) {
      console.warn("[notifyClientNewPhotos] error:", err);
    }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setUploadError("");

    // 1. Buscamos el ID del mecánico autenticado UNA sola vez (fuera del loop)
    let currentMecanicoId = proyecto.mecanico_id;
    if (session?.user?.email) {
      const { data: empData } = await supabase
        .from("empleados")
        .select("id")
        .eq("correo", session.user.email)
        .maybeSingle();
        
      if (empData?.id) {
        currentMecanicoId = empData.id;
      }
    }

    // 2. Procesamos cada archivo
    for (const file of files) {
      // Aseguramos que la extensión sea correcta
      const nombreArchivo = file.name || "foto";
      const ext = nombreArchivo.includes(".") ? nombreArchivo.split(".").pop() : "jpg";
      const path = `${proyecto.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      // Paso A: Subir la foto al bucket
      const { error: storageError } = await supabase.storage
        .from("fotografias")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (storageError) { 
        setUploadError(storageError.message); 
        setUploading(false); 
        return; 
      }

      // Paso B: Obtener la URL pública
      const { data: urlData } = supabase.storage.from("fotografias").getPublicUrl(path);

      // Paso C: Guardar el registro en la base de datos
      const { error: insertError } = await supabase.from("fotografias").insert({
        proyecto_id: proyecto.id,
        mecanico_id: currentMecanicoId, // Usamos la variable que definimos arriba
        url:         urlData.publicUrl,
        momento:     momentoFoto,       // Usamos el "antes", "durante" o "despues" del Dropdown
        descripcion: file.name,
      });

      // Paso D: Si la base de datos falla, borramos la foto del bucket (Limpieza)
      if (insertError) {
        console.error("[DB Insert Error]:", insertError);
        setUploadError("Error al guardar en BD: " + insertError.message);
        await supabase.storage.from("fotografias").remove([path]); // Borra el archivo huérfano
        setUploading(false);
        return; 
      }
    }

    // 3. Terminamos el proceso con éxito
    setUploading(false);
    fetchFotos();
    if (fileRef.current) fileRef.current.value = "";
    
    // Notificar al cliente
    await notifyClientNewPhotos();
  };

    const handleGuardarDescripcion = async () => {
    if (!proyecto?.id || !canUpload) return;
    if (!descripcionProyecto.trim()) { setDescripcionError("La descripción no puede estar vacía."); return; }
    setDescripcionGuardando(true); setDescripcionError("");
    try {
      const { error } = await supabase.from("proyectos")
        .update({ descripcion: descripcionProyecto.trim(), updated_at: new Date().toISOString() })
        .eq("id", proyecto.id);
      if (error) throw error;
      if (onProjectUpdated) onProjectUpdated({ id: proyecto.id, descripcion: descripcionProyecto.trim() });
    } catch (e) {
      setDescripcionError(e?.message || "Error al guardar.");
    } finally {
      setDescripcionGuardando(false);
    }
  };

  if (!open || !proyecto) return null;

  const t       = darkMode ? "text-zinc-100"  : "text-gray-800";
  const st      = darkMode ? "text-zinc-500"  : "text-gray-400";
  const card    = darkMode ? "bg-[#1e1e26] border-zinc-800" : "bg-white border-gray-200";
  const divider = darkMode ? "border-zinc-800" : "border-gray-100";
  const momentoLabel = (value) => {
    if (value === "antes") return "Antes";
    if (value === "durante") return "Durante";
    if (value === "despues") return "Despues";
    return "";
  };
  const momentoBadge = (value) => {
    const map = {
      antes: darkMode ? "bg-amber-900/70 text-amber-200 border-amber-700" : "bg-amber-100 text-amber-800 border-amber-200",
      durante: darkMode ? "bg-sky-900/70 text-sky-200 border-sky-700" : "bg-sky-100 text-sky-800 border-sky-200",
      despues: darkMode ? "bg-emerald-900/70 text-emerald-200 border-emerald-700" : "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
    return map[value] || (darkMode ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-gray-100 text-gray-600 border-gray-200");
  };

  const cleandescripcionText = (value = "") =>
    String(value)
      .split("\n")
      .map((line) => line.replace(/^\s*\[[^\]]+\]\s*/, ""))
      .join("\n")
      .trim();

  const diagnosticosProyecto = Array.isArray(proyecto.diagnosticos) ? proyecto.diagnosticos : [];
  const diagnosticoInicial = diagnosticosProyecto.find((d) => d.tipo === "inicial") || null;
  const observaciones = diagnosticosProyecto
    .filter((d) => d.tipo === "final")
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-black/60 overflow-y-auto anim-fadeIn" onClick={onClose}>
        <div
          className={`relative w-full max-w-2xl rounded-xl border ${card} mb-8`}
          style={{ boxShadow: darkMode ? "0 24px 64px rgba(0,0,0,0.7)" : "0 16px 48px rgba(0,0,0,0.18)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-start justify-between px-6 py-4 border-b ${divider}`}>
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 flex-wrap">
                {proyecto.bloqueado && <LucideIcon name="lock" className="w-4 h-4 text-amber-500" />}
                <h2 className={`font-semibold text-base ${t}`}>{proyecto.titulo}</h2>
                <span className={`px-2 py-0.5 rounded text-xs font-medium border capitalize ${estadoBadge(proyecto.estado, darkMode)}`}>
                  {proyecto.estado?.replace(/_/g, " ")}
                </span>
              </div>
              {proyecto.descripcion && <p className={`text-xs mt-1 ${st}`}>{proyecto.descripcion}</p>}
            </div>
            <button onClick={onClose} className={`text-xl leading-none flex-shrink-0 ${st} hover:text-current transition-colors`}>×</button>
          </div>

          {/* Info grid */}
          <div className={`px-6 py-4 grid grid-cols-2 gap-x-8 gap-y-3 border-b ${divider}`}>
            {[
              ["Cliente",    proyecto.clientes?.nombre],
              ["Vehículo",   proyecto.vehiculos ? `${proyecto.vehiculos.marca} ${proyecto.vehiculos.modelo} · ${proyecto.vehiculos.placas}` : null],
              ["Mecánico",   proyecto.empleados?.nombre],
              ["Ingreso",    fmtDate(proyecto.fecha_ingreso)],
              ["Aprobación", fmtDate(proyecto.fecha_aprobacion)],
              ["Cierre",     fmtDate(proyecto.fecha_cierre)],
            ].map(([label, val]) => val ? (
              <div key={label}>
                <p className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>{label}</p>
                <p className={`text-sm mt-0.5 ${t}`}>{val}</p>
              </div>
            ) : null)}
          </div>

          {/* ── Descripción del proyecto ── */}
          <div className={`px-6 py-4 border-b ${divider}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-widest ${st} mb-2`}>Descripción del proyecto</p>
            <textarea
              value={descripcionProyecto}
              onChange={(e) => setDescripcionProyecto(e.target.value)}
              readOnly={!canUpload}
              rows={3}
              placeholder="Descripción general del proyecto…"
              className={`w-full px-4 py-3 rounded-lg border text-sm resize-none outline-none ${canUpload ? "focus:ring-2 focus:ring-sky-500" : "opacity-90"} ${darkMode ? "bg-[#2a2a35] border-zinc-700 text-zinc-100" : "bg-white border-gray-200 text-gray-800"}`}
            />
            {canUpload && (
              <button
                 onClick={handleGuardarDescripcion}
                 disabled={descripcionGuardando || descripcionProyecto === (proyecto?.descripcion || "")}
                className="mt-2 px-3 py-1.5 rounded-md text-xs font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: C_BLUE }}
              >{descripcionGuardando ? "Guardando…" : "Guardar descripción"}</button>
            )}
            {descripcionError && <p className="mt-1 text-xs text-red-500">{descripcionError}</p>}
          </div>

          {/* ── Diagnóstico inicial ── */}
          <div className={`px-6 py-4 border-b ${divider}`}>
            <DiagnosticoInicialSection
              proyecto={proyecto}
              darkMode={darkMode}
              session={session}
              canUpload={canUpload}
              diagnosticoInicial={diagnosticoInicial}
              formatoBasico={diagnosticoFormatoBasico}
            />
          </div>

          {/* ── Cotización ── */}
          <div className={`px-6 py-4 border-b ${divider}`}>
            <CotizacionDetalleSection
              proyecto={proyecto}
              darkMode={darkMode}
              session={session}
              canUpload={canUpload}
              onActualizado={onProjectUpdated}
            />
          </div>

          {/* ── Observaciones ── */}
          <div className={`px-6 py-4 border-b ${divider}`}>
            <ObservacionesSection
              proyecto={proyecto}
              darkMode={darkMode}
              canUpload={canUpload}
              session={session}
            />
          </div>

          {/* ── Diagnóstico final ── */}
          <div className={`px-6 py-4 border-b ${divider}`}>
            <DiagnosticoFinalSection
              proyecto={proyecto}
              darkMode={darkMode}
              session={session}
              canUpload={canUpload}
              diagnosticoInicial={diagnosticoInicial}
              diagnosticoFinal={diagnosticosProyecto.find(d => d.tipo === "final") || null}
            />
          </div>
          
          <div className={`px-6 py-4 border-b ${divider}`}>
            <p className={`text-xs font-semibold uppercase tracking-widest ${st} mb-3`}>Refacciones en este trabajo</p>

            {diagnosticoFormatoBasico && canUpload && (
            <div className="mb-3 grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-2 items-end">
              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Refacción</label>
                <Select darkMode={darkMode} value={refNuevaId} onChange={(e) => setRefNuevaId(e.target.value)}>
                  <option value="">Seleccionar refacción…</option>
                  {refCatalog.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre} ({r.numero_parte || "SIN NUMERO"}) · Stock: {r.stock}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-widest ${st}`}>Cantidad</label>
                <Input
                  darkMode={darkMode}
                  type="number"
                  min="1"
                  step="1"
                  value={refNuevaCantidad}
                  onChange={(e) => setRefNuevaCantidad(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={handleAgregarRefaccion}
                disabled={addingRefaccion}
                className="px-3 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: C_BLUE }}
              >
                {addingRefaccion ? "Agregando..." : "Agregar"}
              </button>
            </div>
          )}
          {/* Refacciones de cotización */}
          {refaccionesCotizacion.length > 0 && (
            <>
              <p className={`text-[10px] font-semibold uppercase tracking-widest mt-4 mb-2 ${st}`}>
                Refacciones cotizadas
              </p>
              {refaccionesCotizacion.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 text-sm">
                  <div>
                    <p className={t}>{item.refacciones?.nombre || "—"}</p>
                    <p className={st}>{item.refacciones?.numero_parte || "Sin número"} · Cant: {item.cantidad}</p>
                  </div>
                  <p className={`text-sm font-medium ${t}`}>${Number(item.precio_unit || 0).toFixed(2)}</p>
                </div>
              ))}
            </>
          )}

            {refSaveError && <p className="text-xs mb-2" style={{ color: C_RED }}>{refSaveError}</p>}
            {loadingRefacciones ? (
              <p className={`text-xs ${st}`}>Cargando refacciones…</p>
            ) : refaccionesAsignadas.length === 0 ? (
              <p className={`text-xs ${st}`}>Aún no hay refacciones asignadas a este proyecto.</p>
            ) : (
              refaccionesAsignadas.map(r => (
                <div key={r.id} className="flex justify-between items-center py-2 text-sm">
                  <div>
                    <p className={`${t} ${!r.fue_usada ? "opacity-50 line-through" : ""}`}>{r.refacciones?.nombre}</p>
                    <p className={st}>Cant: {r.cantidad}</p>
                  </div>
                  {!r.fue_usada && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${darkMode ? "bg-zinc-800 text-zinc-400 border-zinc-700" : "bg-gray-100 text-gray-400 border-gray-200"}`}>
                      No se necesitó
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Fotografías */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className={`text-xs font-semibold uppercase tracking-widest ${st}`}>
                Fotografías {fotos.length > 0 && `(${fotos.length})`}
              </p>
              {canUpload && (
                <div className="flex items-center gap-2">
                  {uploading && <span className={`text-xs ${st}`}>Subiendo…</span>}
                  
                  <select 
                    value={momentoFoto} 
                    onChange={(e) => setMomentoFoto(e.target.value)}
                    disabled={uploading}
                    className={`text-xs px-2 py-1.5 rounded-lg border outline-none ${darkMode ? "bg-[#2a2a35] border-zinc-700 text-zinc-300" : "bg-gray-50 border-gray-200 text-gray-700"}`}
                  >
                    <option value="antes">Antes</option>
                    <option value="durante">Durante</option>
                    <option value="despues">Después</option>
                  </select>

                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: C_BLUE, color: "white" }}
                  >+ Agregar fotos</button>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleUpload} />
                </div>
              )}
              
            </div>
            {uploadError && <p className="text-xs mb-2" style={{ color: C_RED }}>{uploadError}</p>}
            {loadingFotos ? (
              <div className={`text-center py-6 text-xs ${st}`}>Cargando fotos…</div>
            ) : fotos.length === 0 ? (
              <div className={`text-center py-6 text-xs ${st} border rounded-lg ${darkMode ? "border-zinc-800" : "border-gray-100"}`}>
                {canUpload ? "Aún no hay fotos. Agrega la primera." : "Aún no hay fotos del proyecto."}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {fotos.map((f) => (
                  <div key={f.id} className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group" onClick={() => setLightbox(f.url)}>
                    <img
                      src={f.url}
                      alt={f.descripcion || "Foto"}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      onError={(e) => console.error("[img] failed to load:", f.url, e)}
                    />
                    {momentoLabel(f.momento) && (
                      <span
                        className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${momentoBadge(f.momento)}`}
                      >
                        {momentoLabel(f.momento)}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-end p-2">
                      {f.descripcion && <p className="text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity truncate">{f.descripcion}</p>}
                    </div>
                  </div>
                ))}
                
              </div>

              
            )}
            
          </div>
        </div>
      </div>
            
      {lightbox && createPortal(
        <div className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center p-4 anim-fadeIn" onClick={() => setLightbox(null)}>
          <img
            src={lightbox}
            alt="Foto"
            className="rounded-lg object-contain"
            style={{ maxWidth: "85vw", maxHeight: "85vh", boxShadow: "0 8px 32px rgba(0,0,0,0.8)" }}
            onClick={(e) => e.stopPropagation()}
          />
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: C_RED }}>×</button>
        </div>,
        document.body
      )}
    </>
  );
};

const DashboardShell = ({ session, darkMode, navItems, activeModule, setActiveModule, children, rolLabel, onNotificationClick }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const topbar  = darkMode ? "bg-[#12121a] border-zinc-800" : "bg-white border-gray-200";
  const sidebar = darkMode ? "bg-[#12121a] border-zinc-800" : "bg-white border-gray-200";
  const st      = darkMode ? "text-zinc-500" : "text-gray-400";

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
        <span className="flex-1 text-left">{item.label}</span>
        {Number(item.badge) > 0 && (
          <span
            className={`min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-semibold flex items-center justify-center border ${
              darkMode
                ? "bg-red-900/60 text-red-200 border-red-800"
                : "bg-red-100 text-red-700 border-red-200"
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className={`h-screen overflow-hidden flex flex-col ${darkMode ? "bg-[#16161e] text-white" : "bg-gray-50 text-gray-800"}`}>
      <GlobalStyles />
      <header
        className={`flex-shrink-0 flex items-center justify-between px-4 border-b ${topbar}`}
        style={{ height: "60px", boxShadow: darkMode ? "0 1px 0 rgba(255,255,255,0.03), 0 4px 12px rgba(0,0,0,0.3)" : "0 1px 0 rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center gap-3">
          <button className="md:hidden p-1.5 rounded text-zinc-500 hover:text-zinc-300" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg width="16" height="12" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M0 1h16M0 6h16M0 11h16"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <LogoMark className="h-8 w-auto" darkMode={darkMode} />
            <span className="font-semibold text-base hidden sm:block" style={{ color: C_BLUE }}>Stathmos</span>
            {rolLabel && (
              <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${darkMode ? "border-zinc-700 text-zinc-500" : "border-gray-200 text-gray-400"}`}>
                {rolLabel}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NotificacionesDropdown session={session} darkMode={darkMode} onNotificationClick={onNotificationClick} />
          <UserMenuWithRef session={session} onLogout={handleLogout} darkMode={darkMode} rolLabel={rolLabel} />
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}
        <aside
          className={`fixed md:relative top-0 left-0 h-full w-52 border-r flex flex-col z-20 transition-transform duration-200 ${sidebar} ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
          style={{ boxShadow: darkMode ? "1px 0 0 rgba(255,255,255,0.02)" : "1px 0 0 rgba(0,0,0,0.04)" }}
        >
          <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
            <p className={`text-[10px] font-semibold uppercase tracking-widest px-3 py-2 ${st}`}>Módulos</p>
            {navItems.map((item) => <NavItem key={item.id} item={item} />)}
          </nav>
          <div className={`px-3 py-3 border-t ${darkMode ? "border-zinc-800" : "border-gray-100"}`}>
            <p className={`text-[10px] px-3 ${st}`}>Taller Don Elías</p>
          </div>
        </aside>
        <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

// ─── Dashboard Admin ──────────────────────────────────────────────────────────
const Dashboard = ({ session, darkMode }) => {
  const [activeModule, setActiveModule] = useState("citas");
  const [notifProjectId, setNotifProjectId] = useState(null);

  const handleNotificationClick = (n) => {
    if (n.proyecto_id) {
      setNotifProjectId(n.proyecto_id);
      setActiveModule("proyectos");
    }
  };

  const navItems = [
    { id: "citas", label: "Citas", icon: <LucideIcon name="calendar" /> },
    { id: "clientes",  label: "Clientes",  icon: <LucideIcon name="users" /> },
    { id: "empleados", label: "Empleados", icon: <LucideIcon name="wrench" /> },
    { id: "vehiculos", label: "Vehículos", icon: <LucideIcon name="car" /> },
    { id: "proyectos", label: "Proyectos", icon: <LucideIcon name="tool" /> },
    { id: "pagos-admin", label: "Autorizar Pagos", icon: <LucideIcon name="creditcard" /> },
    { id: "inventario", label: "Inventario", icon: <LucideIcon name="box" /> },
    { id: "historiales", label: "Historiales", icon: <LucideIcon name="history" /> },
    { id: "reportes", label: "Reportes", icon: <LucideIcon name="chart" /> },
  ];
  return (
    <DashboardShell session={session} darkMode={darkMode} navItems={navItems} activeModule={activeModule} setActiveModule={setActiveModule} rolLabel="Administrador" onNotificationClick={handleNotificationClick}>
      {activeModule === "clientes"  && <ClientesModule  darkMode={darkMode} session={session} />}
      {activeModule === "empleados" && <EmpleadosModule darkMode={darkMode} />}
      {activeModule === "vehiculos" && <VehiculosModule darkMode={darkMode} />}
      {activeModule === "proyectos" && <ProyectosModule darkMode={darkMode} session={session} initialProjectId={notifProjectId} />}
      {activeModule === "inventario" && <GestionInventario darkMode={darkMode} role="administrador" />}
      {activeModule === "historiales" && <HistorialesModule darkMode={darkMode} />}
      {activeModule === "citas" && (
        <CitasModule darkMode={darkMode} role="administrador" canManage onAppointmentCreated={(data) => {
          notifyAdminNewAppointment({
            citaId: data.citaId,
            clienteId: data.clienteId,
            fechaHora: `${data.fecha} ${data.hora}`,
            session
          });
        }} />
      )}
      {activeModule === "reportes" && <CentroReportes darkMode={darkMode} />}
      {activeModule === "pagos-admin" && <PagosAdminModule darkMode={darkMode} session={session} />}
    </DashboardShell>
  );
};

// ─── Módulo de Autorización de Pagos (Admin) ─
const PagosAdminModule = ({ darkMode, session }) => {
  const [pagos, setPagos] = useState([]);
  const [pagosCompletados, setPagosCompletados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pendientes"); // "pendientes" o "completados"
  const [selectedPago, setSelectedPago] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [cambiarAEntregado, setCambiarAEntregado] = useState(true);
  const [authorizingPagoId, setAuthorizingPagoId] = useState(null);
  const [authMessage, setAuthMessage] = useState(null); // "success" | "error" | null
  const [authMessageText, setAuthMessageText] = useState("");

  const fetchPagos = useCallback(async () => {
    setLoading(true);
    // Pagos pendientes
    const { data: pagosPend, error: errPend } = await supabase
      .from("pagos")
      .select(`
        id,
        estado,
        monto,
        metodo_cobro,
        fecha_pago,
        proyecto_id,
        proyectos(titulo, cliente_id, estado, clientes(nombre))
      `)
      .eq("estado", "pendiente")
      .order("fecha_pago", { ascending: false });
    
    if (!errPend) setPagos(pagosPend || []);

    // Pagos completados
    const { data: pagosComp, error: errComp } = await supabase
      .from("pagos")
      .select(`
        id,
        estado,
        monto,
        metodo_cobro,
        fecha_pago,
        proyecto_id,
        proyectos(titulo, cliente_id, estado, clientes(nombre))
      `)
      .eq("estado", "completado")
      .order("fecha_pago", { ascending: false });
    
    if (!errComp) setPagosCompletados(pagosComp || []);
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPagos();
  }, [fetchPagos]);

  useSupabaseRealtime("pagos", fetchPagos);

  const handleAuthorizeClick = (pago) => {
    setSelectedPago(pago);
    setCambiarAEntregado(true);
    setShowAuthModal(true);
  };

  const handleConfirmAuthorize = async () => {
    if (!selectedPago) return;
    
    setAuthorizingPagoId(selectedPago.id);
    setAuthMessage(null);
    try {
      const response = await invokeEdgeFunction("autorizar-pago", {
        body: {
          pago_id: selectedPago.id,
          cambiar_a_entregado: cambiarAEntregado,
        },
        userToken: session?.access_token || "",
      });

      if (response.success) {
        setAuthMessage("success");
        const proyectoTitle = selectedPago.proyectos?.titulo || "desconocido";
        const clienteData = selectedPago.proyectos?.clientes;
        setAuthMessageText(
          `Pago autorizado exitosamente. ${cambiarAEntregado ? "Proyecto marcado como entregado." : ""}`
        );
        
        // Notificar al cliente que su pago fue autorizado
        if (clienteData?.usuario_id) {
          try {
            await invokeEdgeFunction("enviar-notificacion", {
              body: {
                usuario_id: clienteData.usuario_id,
                proyecto_id: selectedPago.proyecto_id,
                titulo: "Pago Autorizado",
                mensaje: `Tu pago de $${Number(selectedPago.monto).toFixed(2)} para el proyecto "${proyectoTitle}" ha sido autorizado.${cambiarAEntregado ? " El proyecto ha sido marcado como entregado." : ""}`,
              },
              userToken: session?.access_token || "",
            });
          } catch (notificationErr) {
            console.warn("Error notificando al cliente:", notificationErr);
          }
        }
        
        setTimeout(() => {
          setShowAuthModal(false);
          setSelectedPago(null);
          setAuthMessage(null);
          fetchPagos();
        }, 1500);
      } else {
        setAuthMessage("error");
        setAuthMessageText(response.error || "Error al autorizar el pago");
      }
    } catch (err) {
      console.error("Error autorizando pago:", err);
      setAuthMessage("error");
      setAuthMessageText(err?.message || "Error al autorizar el pago");
    } finally {
      setAuthorizingPagoId(null);
    }
  };

  const t  = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";
  const divider = darkMode ? "divide-zinc-800" : "divide-gray-100";
  const rowH    = darkMode ? "hover:bg-[#25252f]" : "hover:bg-gray-50";
  const headTxt = darkMode ? "text-zinc-500 border-zinc-800" : "text-gray-400 border-gray-100";
  const tabBgActive = darkMode ? "bg-zinc-800/50" : "bg-blue-50";
  const tabBgInactive = darkMode ? "hover:bg-zinc-800/20" : "hover:bg-gray-100";

  const displayPagos = activeTab === "pendientes" ? pagos : pagosCompletados;

  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <div className="mb-6">
        <h2 className={`text-lg font-semibold ${t}`}>Gestión de Pagos</h2>
        <p className={`text-xs ${st} mt-0.5`}>{activeTab === "pendientes" ? pagos.length : pagosCompletados.length} pagos {activeTab === "pendientes" ? "pendientes" : "completados"}</p>
      </div>

      {/* Pestañas */}
      <div className={`flex gap-2 mb-4 border-b ${darkMode ? "border-zinc-800" : "border-gray-200"}`}>
        <button
          onClick={() => setActiveTab("pendientes")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "pendientes"
              ? `border-blue-500 ${t}`
              : `border-transparent ${st} ${tabBgInactive}`
          }`}
        >
          Pendientes ({pagos.length})
        </button>
        <button
          onClick={() => setActiveTab("completados")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "completados"
              ? `border-blue-500 ${t}`
              : `border-transparent ${st} ${tabBgInactive}`
          }`}
        >
          Completados ({pagosCompletados.length})
        </button>
      </div>

      <Card darkMode={darkMode} className="overflow-hidden">
        {loading ? (
          <div className={`p-12 text-center ${st} text-sm`}>Cargando…</div>
        ) : displayPagos.length === 0 ? (
          <div className={`p-12 text-center ${st} text-sm`}>
            {activeTab === "pendientes" ? "No hay pagos pendientes de autorización" : "No hay pagos completados"}
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b text-xs uppercase tracking-wider ${headTxt}`}>
                    {["Proyecto", "Cliente", "Monto", "Método", "Fecha", activeTab === "pendientes" ? "Acción" : "Estado"].map((h, i) => (
                      <th key={i} className={`px-5 py-3 font-medium ${i === 5 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${divider}`}>
                  {displayPagos.map((p) => (
                    <tr key={p.id} className={`transition-colors ${rowH}`}>
                      <td className={`px-5 py-3 font-medium ${t} max-w-[200px] truncate`}>{p.proyectos?.titulo || "—"}</td>
                      <td className={`px-5 py-3 ${st}`}>{p.proyectos?.clientes?.nombre || "—"}</td>
                      <td className={`px-5 py-3 ${t} font-semibold`}>${Number(p.monto).toFixed(2)}</td>
                      <td className={`px-5 py-3 ${st} capitalize`}>{p.metodo_cobro || "—"}</td>
                      <td className={`px-5 py-3 ${st} text-xs`}>{formatDateTimeWorkshop(p.fecha_pago) || "—"}</td>
                      <td className="px-5 py-3 text-right">
                        {activeTab === "pendientes" ? (
                          <BtnAccent 
                            onClick={() => handleAuthorizeClick(p)} 
                            disabled={authorizingPagoId === p.id}
                            color={C_BLUE} 
                            className="text-xs px-3 py-1"
                          >
                            {authorizingPagoId === p.id ? "Autorizando…" : "Autorizar"}
                          </BtnAccent>
                        ) : (
                          <span className="text-xs font-medium text-green-500">Completado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className={`md:hidden divide-y ${divider}`}>
              {displayPagos.map((p) => (
                <div key={p.id} className="px-4 py-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className={`font-medium ${t}`}>{p.proyectos?.titulo || "—"}</p>
                      <p className={`text-xs ${st}`}>{p.proyectos?.clientes?.nombre || "—"}</p>
                    </div>
                    <p className={`text-sm font-semibold ${t} whitespace-nowrap`}>${Number(p.monto).toFixed(2)}</p>
                  </div>
                  <p className={`text-xs ${st}`}>Método: {p.metodo_cobro || "—"}</p>
                  <p className={`text-xs ${st}`}>Fecha: {formatDateTimeWorkshop(p.fecha_pago) || "—"}</p>
                  {activeTab === "pendientes" ? (
                    <BtnAccent 
                      onClick={() => handleAuthorizeClick(p)} 
                      disabled={authorizingPagoId === p.id}
                      color={C_BLUE} 
                      className="text-xs px-3 py-2"
                    >
                      {authorizingPagoId === p.id ? "Autorizando…" : "Autorizar"}
                    </BtnAccent>
                  ) : (
                    <span className="text-xs font-medium text-green-500">Pago Completado</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Modal de Autorización */}
      <Modal open={showAuthModal} onClose={() => setShowAuthModal(false)} title="Autorizar Pago" darkMode={darkMode}>
        {selectedPago && (
          <div className="flex flex-col gap-4">
            {authMessage && (
              <div className={`rounded-lg border p-3 ${
                authMessage === "success"
                  ? darkMode ? "border-green-800/50 bg-green-900/20 text-green-400" : "border-green-200 bg-green-50 text-green-700"
                  : darkMode ? "border-red-800/50 bg-red-900/20 text-red-400" : "border-red-200 bg-red-50 text-red-700"
              }`}>
                <p className="text-sm font-medium">{authMessageText}</p>
              </div>
            )}
            <div className={`rounded-lg border p-4 ${darkMode ? "border-zinc-700 bg-zinc-900/30" : "border-gray-200 bg-gray-50"}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-zinc-400" : "text-gray-500"} mb-2`}>Detalles del Pago</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={st}>Proyecto:</span>
                  <span className={`font-medium ${t}`}>{selectedPago.proyectos?.titulo || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className={st}>Cliente:</span>
                  <span className={`font-medium ${t}`}>{selectedPago.proyectos?.clientes?.nombre || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className={st}>Monto:</span>
                  <span className={`font-semibold ${t}`}>${Number(selectedPago.monto).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={st}>Método:</span>
                  <span className={`capitalize ${t}`}>{selectedPago.metodo_cobro || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className={st}>Estado del Proyecto:</span>
                  <span className={`capitalize ${t}`}>{estadoLabel(selectedPago.proyectos?.estado) || "—"}</span>
                </div>
              </div>
            </div>

            <div className={`rounded-lg border p-4 ${darkMode ? "border-zinc-700 bg-zinc-900/30" : "border-gray-200 bg-gray-50"}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={cambiarAEntregado} 
                  onChange={(e) => setCambiarAEntregado(e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <p className={`text-sm font-medium ${t}`}>Cambiar proyecto a "Entregado"</p>
                  <p className={`text-xs ${st} mt-1`}>
                    {cambiarAEntregado 
                      ? "El proyecto se marcará como entregado al autorizar el pago." 
                      : "El proyecto seguirá en estado \"Terminado\" después de autorizar."}
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 mt-2">
              <button 
                onClick={() => setShowAuthModal(false)} 
                className={`flex-1 py-2 rounded-lg text-sm font-medium border ${darkMode ? "border-zinc-700 text-zinc-400 hover:text-zinc-200" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}
              >
                Cancelar
              </button>
              <BtnAccent 
                onClick={handleConfirmAuthorize} 
                disabled={authorizingPagoId === selectedPago.id}
                color={C_BLUE} 
                className="flex-1 justify-center"
              >
                {authorizingPagoId === selectedPago.id ? "Autorizando…" : "Confirmar Autorización"}
              </BtnAccent>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ─── Módulo Vehículos Cliente (solo lectura, filtrado por cliente autenticado) ─
const MisVehiculosModule = ({ darkMode, clienteId }) => {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading,   setLoading]   = useState(true);

  const [rtTick, setRtTick] = useState(0);
  useSupabaseRealtime("vehiculos", () => setRtTick(t => t + 1));

  useEffect(() => {
    if (!clienteId) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("vehiculos")
        .select("*")
        .eq("cliente_id", clienteId)
        .eq("activo", true)
        .order("created_at", { ascending: false });
      setVehiculos(data || []);
      setLoading(false);
    };
    fetch();
  }, [clienteId, rtTick]);

  const t  = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";
  const divider = darkMode ? "divide-zinc-800" : "divide-gray-100";

  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <div className="mb-6">
        <h2 className={`text-lg font-semibold ${t}`}>Mis Vehículos</h2>
        <p className={`text-xs ${st} mt-0.5`}>{vehiculos.length} registrados</p>
      </div>
      <Card darkMode={darkMode} className="overflow-hidden">
        {loading ? (
          <div className={`p-12 text-center ${st} text-sm`}>Cargando…</div>
        ) : vehiculos.length === 0 ? (
          <div className={`p-12 text-center ${st} text-sm`}>No tienes vehículos registrados aún.</div>
        ) : (
          <div className={`divide-y ${divider}`}>
            {vehiculos.map((v) => (
              <div key={v.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <p className={`font-semibold ${t}`}>{v.marca} {v.modelo} {v.anio ? `(${v.anio})` : ""}</p>
                  <p className={`text-xs font-mono mt-0.5 ${st}`}>Placas: {v.placas}{v.vin ? ` · VIN: ${v.vin}` : ""}</p>
                  {v.color && <p className={`text-xs ${st}`}>Color: {v.color}</p>}
                </div>
                <span className={`self-start sm:self-center px-2 py-0.5 rounded text-xs font-medium border ${darkMode ? "bg-emerald-900/40 text-emerald-400 border-emerald-800" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                  Activo
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
//Modulo carrito de cliente
const MiCarritoModule = ({darkMode, clienteId, session, onNavigate}) =>{
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [showPollingModal, setShowPollingModal] = useState(false);
  const [pollingPagoId,    setPollingPagoId]    = useState(null);
  const [pollingStatus,    setPollingStatus]    = useState("waiting");
  const [efectivoData, setEfectivoData] = useState({ confirmacion: false });
  const [transferenciaData, setTransferenciaData] = useState({ confirmacion: false });
    useEffect(() => {
    if (!showPollingModal || !pollingPagoId) return;
    let cancelled = false;
    const TIMEOUT_MS = 2 * 60 * 1000;
    const start = Date.now();

    const poll = async () => {
      if (cancelled) return;
      if (Date.now() - start > TIMEOUT_MS) {
        if (!cancelled) setPollingStatus("timeout");
        return;
      }
      const { data } = await supabase
        .from("pagos")
        .select("estado")
        .eq("id", pollingPagoId)
        .maybeSingle();

      if (data?.estado === "completado") {
        if (!cancelled) setPollingStatus("success");
        return;
      }
      setTimeout(poll, 3000);
    };

    poll();
    return () => { cancelled = true; };
  }, [showPollingModal, pollingPagoId]);

  useEffect(() => {
    if (!clienteId) return;
    fetchTickets();
  }, [clienteId]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data: proyectos } = await supabase
        .from("proyectos")
        .select(
          `
          id,
          titulo,
          descripcion,
          estado,
          fecha_ingreso,
          fecha_cierre,
          vehiculos (
            marca,
            modelo,
            anio,
            placas
          ),
          cotizaciones (
            estado,
            created_at,
            fecha_emision,
            monto_total,
            monto_mano_obra,
            monto_refacc,
            cotizacion_items (
              descripcion,
              cantidad,
              precio_unit,
              subtotal
            )
          )
        `
        )
        .eq("cliente_id", clienteId)
        .neq("estado", "cancelado")
        .order("fecha_cierre", { ascending: false })
        .order("created_at", { ascending: false, foreignTable: "cotizaciones" });

      if (proyectos) {
        setTickets(proyectos.map((p) => {
          const cotizacion = getLatestCotizacion(p);
          return {
            id: p.id,
            titulo: p.titulo,
            descripcion: p.descripcion,
            estado: p.estado,
            fechaIngreso: p.fecha_ingreso,
            fechaCierre: p.fecha_cierre,
            vehiculo: p.vehiculos,
            cotizacion,
            items: cotizacion?.cotizacion_items || [],
          };
        }));
      }
    } catch (error) {
      console.error("Error al obtener tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (metodo) => {
    try {
      if (!selectedTicket?.id) {
        setPaymentError("Ticket inválido.");
        setProcessingPayment(false);
        return;
      }
      if (!isPayable(selectedTicket)) {
        setPaymentError("No es posible procesar el pago: la cotización debe estar aprobada y el proyecto en progreso, pendiente de refacción o terminado.");
        setProcessingPayment(false);
        return;
      }
      setProcessingPayment(true);
      setPaymentError(null);

      if (metodo === "efectivo") {
        if (!efectivoData.confirmacion) {
          setPaymentError("Por favor confirma que pagarás en efectivo");
          setProcessingPayment(false);
          return;
        }
      } else if (metodo === "transferencia") {
        if (!transferenciaData.confirmacion) {
          setPaymentError("Por favor confirma que realizarás la transferencia");
          setProcessingPayment(false);
          return;
        }
      }

      const montoRaw = selectedTicket.cotizacion?.monto_total;
      const montoTotal = (montoRaw == null || isNaN(Number(montoRaw))) ? 0 : Number(montoRaw);

      if (montoTotal <= 0) {
        throw new Error("No se puede cobrar un ticket sin cotización válida.");
      }

      const metodoCobro = metodo === "stripe" ? "tarjeta" : metodo;
      const payload = {
        proyecto_id: selectedTicket.id,
        monto: montoTotal,
        metodo_cobro: metodoCobro,
        referencia: null,
      };

      const { data: json, error: invokeError } = await supabase.functions.invoke("crear-pago", {
        body: payload,
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (invokeError) {
        const message = await getFunctionErrorMessage(invokeError, "No se pudo invocar la función crear-pago.");
        throw new Error(message);
      }
      if (!json?.success) {
        throw new Error(json?.error || "No se pudo registrar el pago.");
      }

      await notifyAdminPayment({
        proyectoId: selectedTicket.id,
        tituloProyecto: selectedTicket.titulo,
        monto: montoTotal,
        session,
      });

      setPaymentSuccess(true);
      setShowPaymentForm(false);
      if (metodo === "efectivo" || metodo === "transferencia") {
        setPollingPagoId(json?.pago?.id || null);
        setShowPollingModal(true);
      } else {
        setTimeout(() => {
          navigate(`/ticket/${selectedTicket.id}`);
        }, 500);     
      } 
    } catch (error) {
      console.error("Error al procesar pago:", error);
      setPaymentError("Error al procesar el pago: " + (error?.message || String(error)));
    } finally {
      setProcessingPayment(false);
    }
  };
  
  const t  = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";

  if (selectedTicket) {
    const montoTotal = selectedTicket.cotizacion?.monto_total || 0;
    const montoManoObra = selectedTicket.cotizacion?.monto_mano_obra || 0;
    const montoRefacciones = selectedTicket.cotizacion?.monto_refacc || 0;
    const cotizacionAprobada = selectedTicket.cotizacion?.estado === "aprobada";
    const estadoProyecto = String(selectedTicket.estado || "").toLowerCase().trim();
    const pagoHabilitado = PAYMENT_ALLOWED_STATES.includes(estadoProyecto) && cotizacionAprobada;
    const bloqueoProcesoTecnico = ["pendiente_diagnostico", "pendiente_cotizacion", "pendiente_aprobacion", "no_aprobado"].includes(estadoProyecto) || !cotizacionAprobada;
    const mensajePagoNoDisponible = estadoProyecto === "entregado"
      ? "Este proyecto ya fue pagado."
      : bloqueoProcesoTecnico
        ? "El proceso técnico no ha iniciado. Debes aprobar la cotización antes de pagar."
        : "El pago se habilitará cuando el proyecto esté en progreso, pendiente de refacción o terminado, con cotización aprobada.";

    return (
      <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
        <button
          onClick={() => {
            setSelectedTicket(null);
            setPaymentSuccess(false);
            setPaymentError(null);
            setShowPaymentForm(false);
          }}
          className={`mb-4 px-4 py-2 rounded text-sm font-medium ${
            darkMode
              ? "bg-zinc-700 text-white hover:bg-zinc-600"
              : "bg-gray-300 text-gray-900 hover:bg-gray-400"
          }`}
        >
          ← Volver
        </button>

        <div className="max-w-2xl">
          {/* Encabezado */}
          <Card darkMode={darkMode} className="mb-6">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className={`text-2xl font-bold ${t}`}>Ticket #{selectedTicket.id.slice(0, 8).toUpperCase()}</h1>
                  <p className={`text-sm ${st} mt-1`}>
                    {fmtDate(selectedTicket.fechaIngreso)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedTicket.estado === "entregado"
                      ? "bg-emerald-900/30 text-emerald-300 border border-emerald-800"
                      : "bg-blue-900/30 text-blue-300 border border-blue-800"
                  }`}
                >
                  {estadoLabel(selectedTicket.estado)}
                </span>
              </div>
            </div>
          </Card>

          {/* Vehículo */}
          <Card darkMode={darkMode} className="mb-6">
            <div className="p-6">
              <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${t}`}>
                <LucideIcon name="car" className="w-5 h-5" />
                Tu Vehículo
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-xs ${st}`}>Marca</p>
                  <p className={`font-semibold ${t}`}>{selectedTicket.vehiculo?.marca || "—"}</p>
                </div>
                <div>
                  <p className={`text-xs ${st}`}>Modelo</p>
                  <p className={`font-semibold ${t}`}>{selectedTicket.vehiculo?.modelo || "—"}</p>
                </div>
                <div>
                  <p className={`text-xs ${st}`}>Año</p>
                  <p className={`font-semibold ${t}`}>{selectedTicket.vehiculo?.anio || "—"}</p>
                </div>
                <div>
                  <p className={`text-xs ${st}`}>Placas</p>
                  <p className={`font-semibold ${t}`}>{selectedTicket.vehiculo?.placas || "—"}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Servicio */}
          <Card darkMode={darkMode} className="mb-6">
            <div className="p-6">
              <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${t}`}>
                <LucideIcon name="tool" className="w-5 h-5" />
                Servicio Realizado
              </h2>
              <p className={`font-semibold ${t} mb-2`}>{selectedTicket.titulo}</p>
              <p className={`text-sm ${st} mb-4`}>{selectedTicket.descripcion}</p>
              
              {(selectedTicket.items || []).length > 0 && (
                <div>
                  <p className={`font-semibold text-sm mb-2 ${t}`}>Items:</p>
                  <div className="space-y-2">
                    {(selectedTicket.items || []).map((item, idx) => (
                      <div key={idx} className={`flex justify-between p-2 rounded text-sm ${darkMode ? "bg-zinc-900/30" : "bg-gray-100"}`}>
                        <div>
                          <p className={t}>{item.descripcion}</p>
                          <p className={`text-xs ${st}`}>x{item.cantidad}</p>
                        </div>
                        <p className="text-emerald-500 font-semibold">${item.subtotal.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Precio */}
          <Card darkMode={darkMode} className="mb-6">
            <div className="p-6">
              <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${t}`}>
                <LucideIcon name="dollar" className="w-5 h-5" />
                Total
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className={st}>Mano de Obra</p>
                  <p className={`font-semibold ${t}`}>${montoManoObra.toFixed(2)}</p>
                </div>
                <div className="flex justify-between">
                  <p className={st}>Refacciones</p>
                  <p className={`font-semibold ${t}`}>${montoRefacciones.toFixed(2)}</p>
                </div>
                <div className={`border-t pt-2 flex justify-between ${darkMode ? "border-zinc-700" : "border-gray-200"}`}>
                  <p className={`font-semibold ${t}`}>Total</p>
                  <p className="text-emerald-500 font-bold text-xl">${montoTotal.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Métodos de Pago */}
          {pagoHabilitado && (
            <Card darkMode={darkMode}>
              <div className="p-6">
                <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${t}`}>
                  <LucideIcon name="creditcard" className="w-5 h-5" />
                  Selecciona Método de Pago
                </h2>

                {paymentSuccess && (
                  <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-4 mb-4">
                    <p className="text-emerald-300 font-semibold flex items-center gap-2">
                      <LucideIcon name="check" className="w-4 h-4" /> Pago completado. El auto está listo para recoger!
                    </p>
                    <button
                      onClick={() => navigate(`/ticket/${selectedTicket.id}`)}
                      className="mt-3 px-3 py-1.5 rounded text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      Imprimir ticket de cobro
                    </button>
                  </div>
                )}

                {paymentError && (
                  <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4">
                    <p className="text-red-300 text-sm">{paymentError}</p>
                  </div>
                )}

                {!showPaymentForm ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Efectivo */}
                    <button
                      onClick={() => {
                        setSelectedPayment("efectivo");
                        setShowPaymentForm(true);
                      }}
                      disabled={processingPayment}
                      className={`p-4 rounded-lg border-2 transition text-center ${
                        selectedPayment === "efectivo"
                          ? "border-green-500 bg-green-900/10"
                          : darkMode
                          ? "border-zinc-700 bg-zinc-900/50 hover:border-green-600"
                          : "border-gray-300 bg-gray-50 hover:border-green-500"
                      }`}
                    >
                      <div className="flex justify-center mb-2">
                        <LucideIcon name="dollar" className="w-8 h-8 text-emerald-500" />
                      </div>
                      <p className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>Efectivo</p>
                      <p className={`text-xs ${darkMode ? "text-zinc-400" : "text-gray-600"}`}>Pago en caja</p>
                    </button>

                    {/* Transferencia */}
                    <button
                      onClick={() => {
                        setSelectedPayment("transferencia");
                        setShowPaymentForm(true);
                        setTransferenciaData({ confirmacion: false });
                      }}
                      disabled={processingPayment}
                      className={`p-4 rounded-lg border-2 transition text-center ${
                        selectedPayment === "transferencia"
                          ? "border-sky-500 bg-sky-900/10"
                          : darkMode
                          ? "border-zinc-700 bg-zinc-900/50 hover:border-sky-600"
                          : "border-gray-300 bg-gray-50 hover:border-sky-500"
                      }`}
                    >
                      <div className="flex justify-center mb-2">
                        <LucideIcon name="bank" className="w-8 h-8 text-sky-500" />
                      </div>
                      <p className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>Transferencia</p>
                      <p className={`text-xs ${darkMode ? "text-zinc-400" : "text-gray-600"}`}>Depósito bancario</p>
                    </button>

                    {/* Stripe */}
                    <button
                      onClick={() => {
                        setSelectedPayment("stripe");
                        setShowPaymentForm(true);
                      }}
                      disabled={processingPayment}
                      className={`p-4 rounded-lg border-2 transition text-center ${
                        selectedPayment === "stripe"
                          ? "border-purple-500 bg-purple-900/10"
                          : darkMode
                          ? "border-zinc-700 bg-zinc-900/50 hover:border-purple-600"
                          : "border-gray-300 bg-gray-50 hover:border-purple-500"
                      }`}
                    >
                      <div className="flex justify-center mb-2">
                        <LucideIcon name="lock" className="w-8 h-8 text-purple-500" />
                      </div>
                      <p className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>Stripe</p>
                      <p className={`text-xs ${darkMode ? "text-zinc-400" : "text-gray-600"}`}>Pago en línea</p>
                    </button>
                  </div>
               
                ) : selectedPayment === "efectivo" ? (
                  <div className="space-y-4">
                    <div className={`p-4 rounded border ${darkMode ? "bg-zinc-900/50 border-zinc-700" : "bg-yellow-50 border-yellow-200"}`}>
                      <p className={`text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>
                        Confirmas que pagarás <strong>${montoTotal.toFixed(2)}</strong> en efectivo en caja?
                      </p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={efectivoData.confirmacion}
                        onChange={(e) => setEfectivoData({confirmacion: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span className={darkMode ? "text-zinc-300" : "text-gray-700"}>Confirmo que pagaré en efectivo</span>
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowPaymentForm(false)}
                        className={`flex-1 px-4 py-2 rounded font-medium ${darkMode ? "bg-zinc-700 text-white hover:bg-zinc-600" : "bg-gray-300 text-gray-900 hover:bg-gray-400"}`}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handlePayment("efectivo")}
                        disabled={processingPayment}
                        className="flex-1 px-4 py-2 rounded font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {processingPayment ? "Procesando..." : "Confirmar Pago"}
                      </button>
                    </div>
                  </div>
                ) : selectedPayment === "transferencia" ? (
                  <div className="space-y-4">
                    <div className={`p-4 rounded border ${darkMode ? "bg-zinc-900/50 border-zinc-700" : "bg-sky-50 border-sky-200"}`}>
                      <p className={`text-sm font-medium mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
                        Realiza una transferencia por <strong>${montoTotal.toFixed(2)}</strong> a la siguiente cuenta:
                      </p>
                      <div className={`rounded-lg px-4 py-3 text-center ${darkMode ? "bg-zinc-800" : "bg-white border border-sky-200"}`}>
                        <p className={`text-xs uppercase tracking-widest mb-1 ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>Número de cuenta</p>
                        <p className={`text-xl font-bold tracking-widest ${darkMode ? "text-sky-400" : "text-sky-600"}`}>4152 3142 1223 9423</p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={transferenciaData.confirmacion}
                        onChange={(e) => setTransferenciaData({ confirmacion: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className={darkMode ? "text-zinc-300" : "text-gray-700"}>Confirmo que realizaré la transferencia al número indicado</span>
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowPaymentForm(false)}
                        className={`flex-1 px-4 py-2 rounded font-medium ${darkMode ? "bg-zinc-700 text-white hover:bg-zinc-600" : "bg-gray-300 text-gray-900 hover:bg-gray-400"}`}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handlePayment("transferencia")}
                        disabled={processingPayment}
                        className="flex-1 px-4 py-2 rounded font-medium bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
                      >
                        {processingPayment ? "Procesando..." : "Pago realizado"}
                      </button>
                    </div>
                  </div>
                ) : selectedPayment === "stripe" ? (
                  <div className="space-y-4">
                    <div className={`p-4 rounded border ${darkMode ? "bg-zinc-900/50 border-zinc-700" : "bg-purple-50 border-purple-200"}`}>
                      <p className={`text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>
                        Serás redirigido a Stripe para completar el pago de <strong>${montoTotal.toFixed(2)}</strong>
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowPaymentForm(false)}
                        className={`flex-1 px-4 py-2 rounded font-medium ${darkMode ? "bg-zinc-700 text-white hover:bg-zinc-600" : "bg-gray-300 text-gray-900 hover:bg-gray-400"}`}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handlePayment("stripe")}
                        disabled={processingPayment}
                        className="flex-1 px-4 py-2 rounded font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                      >
                        {processingPayment ? "Procesando..." : "Pagar con Stripe"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>
          )}

          {!pagoHabilitado && (
            <Card darkMode={darkMode} className="border-2 border-amber-600">
              <div className="p-6 text-center">
                <p className={`text-lg font-semibold ${darkMode ? "text-amber-300" : "text-amber-700"}`}>
                  ⏳ Pago no disponible
                </p>
                <p className={`text-sm mt-2 ${darkMode ? "text-amber-200" : "text-amber-600"}`}>
                  Estado actual: <span className="font-bold capitalize">{selectedTicket.estado}</span>
                </p>
                <p className={`text-xs mt-3 ${st}`}>
                  {mensajePagoNoDisponible}
                </p>
              </div>
            </Card>
          )}
        </div>
        {showPollingModal && createPortal(
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/70">
            <div className={`w-full max-w-sm rounded-2xl p-8 flex flex-col items-center gap-5 ${darkMode ? "bg-[#1e1e28]" : "bg-white"}`}
              style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>
              <LogoMark className="h-10 w-auto" darkMode={darkMode} />
              {pollingStatus === "waiting" && (<>
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                <div className="text-center">
                  <p className={`font-semibold text-sm ${darkMode ? "text-zinc-100" : "text-gray-800"}`}>Esperando validación de pago</p>
                  <p className={`text-xs mt-1 ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>El administrador está revisando tu pago. El ticket se generará automáticamente una vez validado.</p>
                </div>
                <button
                  onClick={() => { setShowPollingModal(false); onNavigate("mis-tickets"); }}
                  className={`text-xs px-4 py-2 rounded-lg border ${darkMode ? "border-zinc-700 text-zinc-400" : "border-gray-200 text-gray-500"}`}>
                  Omitir — ver mis tickets después
                </button>
              </>)}
              {pollingStatus === "success" && (<>
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <LucideIcon name="check" className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="text-center">
                  <p className={`font-semibold text-sm ${darkMode ? "text-zinc-100" : "text-gray-800"}`}>¡Pago validado!</p>
                  <p className={`text-xs mt-1 ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>Tu pago fue confirmado. Redirigiendo a tu ticket…</p>
                </div>
                {(() => { setTimeout(() => { setShowPollingModal(false); navigate(`/ticket/${selectedTicket?.id}`); }, 1500); return null; })()}
              </>)}
              {pollingStatus === "timeout" && (<>
                <p className={`font-semibold text-sm text-center ${darkMode ? "text-zinc-100" : "text-gray-800"}`}>El administrador aún no ha validado el pago.</p>
                <p className={`text-xs text-center ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>Puedes revisar el estado en "Mis Tickets" más tarde.</p>
                <button
                  onClick={() => { setShowPollingModal(false); onNavigate("mis-tickets"); }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: C_BLUE }}>
                  Ir a mis tickets
                </button>
              </>)}
            </div>
          </div>,
          document.body
        )}  
      </div>
    );
  }

  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <div className="mb-6">
        <h2 className={`text-lg font-semibold flex items-center gap-2 ${t}`}>
          <LucideIcon name="clipboard" className="w-5 h-5" />
          Mis Tickets
        </h2>
        <p className={`text-xs ${st} mt-0.5`}>{tickets.length} en total</p>
      </div>

      {loading ? (
        <div className={`text-center ${st} text-sm`}>Cargando tickets...</div>
      ) : tickets.length === 0 ? (
        <div className={`text-center ${st} text-sm`}>No tienes tickets disponibles aún.</div>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              darkMode={darkMode}
              className="cursor-pointer transition hover:shadow-lg"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="p-4 md:p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className={`text-xs font-mono ${st}`}>
                      #{ticket.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className={`font-semibold text-lg ${t}`}>{ticket.titulo}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      ticket.estado === "entregado"
                        ? "bg-emerald-900/30 text-emerald-300 border border-emerald-800"
                        : "bg-blue-900/30 text-blue-300 border border-blue-800"
                    }`}
                  >
                    {estadoLabel(ticket.estado)}
                  </span>
                </div>
                {/* Botón Pagar directo en lista si es pagable */}
                {isPayable(ticket) && (
                  <div className="mt-3">
                    <button
                      onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTicket(ticket);
                              setSelectedPayment(null);
                              setShowPaymentForm(false);
                            }}
                      className="mt-2 inline-block px-3 py-1 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Pagar
                    </button>
                  </div>
                )}
                {!isPayable(ticket) && (
                  <p className={`mt-3 text-xs ${st}`}>
                    {String(ticket.estado || "").toLowerCase().trim() === "entregado"
                      ? "Pago registrado."
                      : "Proceso técnico no iniciado o cotización sin aprobar."}
                  </p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className={`text-xs ${st}`}>Vehículo</p>
                    <p className={`font-semibold ${t}`}>
                      {ticket.vehiculo?.marca} {ticket.vehiculo?.modelo}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${st}`}>Año</p>
                    <p className={`font-semibold ${t}`}>{ticket.vehiculo?.anio}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${st}`}>Total</p>
                    <p className="font-bold text-emerald-500">
                      ${(ticket.cotizacion?.monto_total || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${st}`}>Fecha</p>
                    <p className={`font-semibold ${t}`}>
                      {fmtDate(ticket.fechaCierre)}
                    </p>
                  </div>
                </div>

                <p className={`text-sm ${st}`}>{ticket.descripcion}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Módulo Proyectos Cliente (solo lectura, filtrado por cliente autenticado) ─
const MisProyectosModule = ({ darkMode, clienteId, session, initialProjectId = null }) => {
  const [proyectos,   setProyectos]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [detalle,     setDetalle]     = useState(null);
  const [decisionLoadingId, setDecisionLoadingId] = useState(null);
  const [decisionError, setDecisionError] = useState("");
  const [decisionSuccess, setDecisionSuccess] = useState("");
  const [quoteConfirm, setQuoteConfirm] = useState(null);

  const fetch = useCallback(async () => {
    if (!clienteId) {
      setProyectos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from("proyectos")
      .select("*, clientes(nombre), vehiculos(marca,modelo,placas), empleados(nombre),  diagnosticos(id,tipo,sintomas,descripcion,causa_raiz,created_at,empleados(nombre),tipo_operacion), cotizaciones(id,monto_mano_obra,monto_refacc,monto_total,estado,notas,created_at,fecha_emision,fecha_respuesta)")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false });

    setProyectos(data || []);
    setLoading(false);
  }, [clienteId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useSupabaseRealtime("proyectos", fetch);
  useSupabaseRealtime("cotizaciones", fetch);
  useSupabaseRealtime("diagnosticos", fetch);

  useEffect(() => {
    if (initialProjectId && proyectos.length > 0) {
      const target = proyectos.find(p => p.id === initialProjectId);
      if (target) setDetalle(target);
    }
  }, [initialProjectId, proyectos]);

  useEffect(() => {
    if (!detalle?.id) return;
    const updated = proyectos.find((p) => p.id === detalle.id);
    if (updated) setDetalle(updated);
  }, [proyectos, detalle?.id]);

  const handleCotizacionDecision = async (proyecto, decision) => {
    if (!clienteId) return;
    const cotizacion = getLatestCotizacion(proyecto);
    if (!cotizacion?.id) return;

    setDecisionLoadingId(proyecto.id);
    setDecisionError("");
    setDecisionSuccess("");

    let json = null;
    try {
      json = await invokeEdgeFunction("resolver-cotizacion", {
        body: { cotizacion_id: cotizacion.id, accion: decision },
        userToken: session?.access_token || "",
      });
    } catch (err) {
      const msg = err?.message || "No se pudo registrar tu respuesta a la cotizacion.";
      setDecisionError(msg);
      setDecisionLoadingId(null);
      return;
    }

    if (!json?.success) {
      const msg = json?.error || "No se pudo registrar tu respuesta a la cotizacion.";
      setDecisionError(msg);
      setDecisionLoadingId(null);
      return;
    }

    const nextEstado = json?.estado || (decision === "aprobar" ? "aprobada" : "rechazada");
    const nowIso = new Date().toISOString();

    setProyectos((prev) => prev.map((p) => {
      if (p.id !== proyecto.id) return p;
      const existing = Array.isArray(p.cotizaciones) ? p.cotizaciones : [];
      let found = false;
      const mapped = existing.map((c) => {
        if (c.id !== cotizacion.id) return c;
        found = true;
        return { ...c, estado: nextEstado, fecha_respuesta: nowIso };
      });
      const cotizaciones = found
        ? mapped
        : [...mapped, { ...cotizacion, estado: nextEstado, fecha_respuesta: nowIso }];
      const updatedProyecto = { ...p, cotizaciones };
      if (json?.estado_proyecto) updatedProyecto.estado = json.estado_proyecto;
      return updatedProyecto;
    }));

    setDetalle((prev) => {
      if (!prev || prev.id !== proyecto.id) return prev;
      const existing = Array.isArray(prev.cotizaciones) ? prev.cotizaciones : [];
      let found = false;
      const mapped = existing.map((c) => {
        if (c.id !== cotizacion.id) return c;
        found = true;
        return { ...c, estado: nextEstado, fecha_respuesta: nowIso };
      });
      const cotizaciones = found
        ? mapped
        : [...mapped, { ...cotizacion, estado: nextEstado, fecha_respuesta: nowIso }];
      const updated = { ...prev, cotizaciones };
      if (json?.estado_proyecto) updated.estado = json.estado_proyecto;
      return updated;
    });

    setDecisionSuccess(
      decision === "aprobar"
        ? "Cotizacion aprobada correctamente."
        : "Cotizacion rechazada correctamente."
    );
    setDecisionLoadingId(null);
  };

  const t  = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";
  const divider = darkMode ? "divide-zinc-800" : "divide-gray-100";
  const rowH    = darkMode ? "hover:bg-[#25252f]" : "hover:bg-gray-50";

  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <div className="mb-6">
        <h2 className={`text-lg font-semibold ${t}`}>Mis Proyectos</h2>
        <p className={`text-xs ${st} mt-0.5`}>{proyectos.length} en total</p>
      </div>
      {decisionError && <p className="mb-3 text-sm" style={{ color: C_RED }}>{decisionError}</p>}
      {decisionSuccess && <p className="mb-3 text-sm" style={{ color: "#10b981" }}>{decisionSuccess}</p>}
      <Card darkMode={darkMode} className="overflow-hidden">
        {loading ? (
          <div className={`p-12 text-center ${st} text-sm`}>Cargando…</div>
        ) : proyectos.length === 0 ? (
          <div className={`p-12 text-center ${st} text-sm`}>No tienes proyectos registrados aún.</div>
        ) : (
          <div className={`divide-y ${divider}`}>
            {proyectos.map((p) => (
              <div
                key={p.id}
                className={`px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-3 cursor-pointer transition-colors ${rowH}`}
                onClick={() => setDetalle(p)}
              >
                <div className="flex-1">
                  {(() => {
                    const cot = getLatestCotizacion(p);
                    const quotePending = cot && ["pendiente", "modificada"].includes(cot.estado);
                    const quoteApprovable = cot && ["pendiente", "modificada", "rechazada"].includes(cot.estado);
                    return (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          {cot && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                              cot.estado === "aprobada"
                                ? (darkMode ? "bg-emerald-900/40 text-emerald-300 border-emerald-800" : "bg-emerald-50 text-emerald-700 border-emerald-200")
                                : cot.estado === "rechazada"
                                ? (darkMode ? "bg-red-900/40 text-red-300 border-red-800" : "bg-red-50 text-red-700 border-red-200")
                                : (darkMode ? "bg-amber-900/40 text-amber-300 border-amber-800" : "bg-amber-50 text-amber-700 border-amber-200")
                            }`}>
                              Cotización: {cot.estado}
                            </span>
                          )}
                        </div>
                        {cot && (
                          <p className={`text-xs mb-1 ${st}`}>
                            Presupuesto estimado: <span className="font-semibold">${Number(cot.monto_total || (Number(cot.monto_mano_obra || 0) + Number(cot.monto_refacc || 0))).toFixed(2)}</span>
                          </p>
                        )}
                        {quoteApprovable && (
                          <div className="flex gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              disabled={decisionLoadingId === p.id}
                              onClick={() => setQuoteConfirm({
                                proyecto: p,
                                decision: "aprobar",
                                title: "Confirmar aprobación",
                                message: "¿Confirmas que deseas <strong>aprobar</strong> la cotización actual?",
                                confirmLabel: "Aprobar cotización",
                              })}
                              className="px-2.5 py-1 rounded text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {decisionLoadingId === p.id ? "Procesando..." : "Aprobar"}
                            </button>
                            {quotePending && (
                              <button
                                disabled={decisionLoadingId === p.id}
                                onClick={() => handleCotizacionDecision(p, "rechazar")}
                                className="px-2.5 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                Rechazar
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                  <div className="flex items-center gap-2 mb-1">
                    {p.bloqueado && <LucideIcon name="lock" className="w-3.5 h-3.5 text-amber-500" />}
                    <p className={`font-semibold ${t}`}>{p.titulo}</p>
                  </div>
                  {p.descripcion && <p className={`text-xs ${st} mb-1`}>{p.descripcion}</p>}
                  <p className={`text-xs ${st}`}>
                    {p.vehiculos ? `${p.vehiculos.marca} ${p.vehiculos.modelo} · ${p.vehiculos.placas}` : "—"}
                    {p.empleados?.nombre ? ` · Mecánico: ${p.empleados.nombre}` : ""}
                  </p>
                  <p className={`text-xs ${st} mt-0.5`}>Ingreso: {fmtDate(p.fecha_ingreso)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`self-start px-2 py-0.5 rounded text-xs font-medium border capitalize ${estadoBadge(p.estado, darkMode)}`}>
                    {p.estado.replace(/_/g, " ")}
                  </span>
                  <span className={`text-xs ${st}`}>Ver →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <ProyectoDetalleModal
      
        open={!!detalle} onClose={() => setDetalle(null)}
        proyecto={detalle} darkMode={darkMode}
        canUpload={false} session={session}
      />

      <ConfirmModal
        open={!!quoteConfirm}
        onClose={() => setQuoteConfirm(null)}
        title={quoteConfirm?.title || "Confirmación"}
        message={quoteConfirm?.message || "¿Deseas continuar?"}
        onConfirm={() => {
          const proyecto = quoteConfirm?.proyecto;
          const decision = quoteConfirm?.decision;
          setQuoteConfirm(null);
          if (proyecto && decision) {
            handleCotizacionDecision(proyecto, decision);
          }
        }}
        confirmLabel={quoteConfirm?.confirmLabel || "Confirmar"}
        confirmColor={C_BLUE}
        darkMode={darkMode}
      />
    </div>
  );
};

// ─── Dashboard Cliente ────────────────────────────────────────────────────────
const DashboardCliente = ({ session, darkMode }) => {
  const [activeModule, setActiveModule] = useState("citas");
  const [clienteId,    setClienteId]    = useState(null);
  const [notifProjectId, setNotifProjectId] = useState(null);

  const handleNotificationClick = (n) => {
    if (n.proyecto_id) {
      setNotifProjectId(n.proyecto_id);
      setActiveModule("mis-proyectos");
    }
  };

  useEffect(() => {
    const loadCliente = async () => {
      const { data } = await supabase
        .from("clientes")
        .select("id")
        .eq("correo", session.user.email)
        .maybeSingle();
      if (data?.id) setClienteId(data.id);
    };
    loadCliente();
  }, [session]);

  const navItems = [
    { id: "citas",         label: "Citas",          icon: <LucideIcon name="calendar" /> },
    { id: "mis-proyectos", label: "Mis Proyectos", icon: <LucideIcon name="tool" /> },
    { id: "mis-vehiculos", label: "Mis Vehículos",  icon: <LucideIcon name="car" /> },
    { id: "mi-carrito",    label: "Mi carrito",   icon: <LucideIcon name="shoppingcart" /> },
    { id: "mis-tickets",   label: "Mis Tickets",  icon: <LucideIcon name="receipt" /> },
  ];

  return (
    <DashboardShell session={session} darkMode={darkMode} navItems={navItems} activeModule={activeModule} setActiveModule={setActiveModule} rolLabel="Cliente" onNotificationClick={handleNotificationClick}>
      {activeModule === "mis-proyectos" && <MisProyectosModule darkMode={darkMode} clienteId={clienteId} session={session} initialProjectId={notifProjectId} />}
      {activeModule === "mis-vehiculos" && <MisVehiculosModule darkMode={darkMode} clienteId={clienteId} />}
      {activeModule === "citas" && <CitasModule darkMode={darkMode} role="cliente" clienteId={clienteId} onAppointmentCreated={(data) => {
        notifyAdminNewAppointment({
          citaId: data.citaId,
          clienteId: data.clienteId,
          fechaHora: `${data.fecha} ${data.hora}`,
          session
        });
      }} />}
      {activeModule === "mi-carrito" && <MiCarritoModule darkMode={darkMode} clienteId={clienteId} session={session} onNavigate={setActiveModule}/>}      {activeModule === "mis-tickets" && (<HistorialTicketsWrapper darkMode={darkMode} />)}     
    </DashboardShell>
  );
};

// ─── Módulo Proyectos Mecánico (proyectos asignados a él) ──────────────────────
const ProyectosMecanicoModule = ({ darkMode, empleadoId, session, initialProjectId = null }) => {
  const [proyectos,    setProyectos]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterEstado, setFilterEstado] = useState("todos");
  const [actionError,  setActionError]  = useState("");
  const [estadoConfirm, setEstadoConfirm] = useState(null);
  const fetch = useCallback(async () => {
    if (!empleadoId) return;
    setLoading(true);
    const { data } = await supabase
      .from("proyectos")
      .select("*, clientes(nombre,telefono,usuario_id), vehiculos(marca,modelo,placas,anio), diagnosticos(id,tipo,sintomas,descripcion,causa_raiz,created_at,empleados(nombre),tipo_operacion), cotizaciones(id,monto_mano_obra,monto_refacc,monto_total,estado,created_at,updated_at,fecha_emision,fecha_respuesta)")
      .eq("mecanico_id", empleadoId)
      .order("created_at", { ascending: false });
    setProyectos(data || []);
    setLoading(false);
  }, [empleadoId]);

  useEffect(() => { fetch(); }, [fetch]);
  useSupabaseRealtime("proyectos", fetch);

  useEffect(() => {
    if (initialProjectId && proyectos.length > 0) {
      const target = proyectos.find(p => p.id === initialProjectId);
      if (target) setDetalle(target);
    }
  }, [initialProjectId, proyectos]);

  const filtered = proyectos.filter((p) =>
    filterEstado === "todos" || p.estado === filterEstado
  );

  const t  = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";
  const divider = darkMode ? "divide-zinc-800" : "divide-gray-100";



  const getMecanicoAllowedTransitions = (estadoActual) => {
    const actual = String(estadoActual || "").toLowerCase().trim();
    if (actual === "en_progreso") return ["en_progreso", "pendiente_refaccion", "terminado"];
    if (actual === "pendiente_refaccion") return ["pendiente_refaccion", "en_progreso", "terminado"];
    if (actual === "terminado") return ["terminado"];
    return [];
  };

  const handleEstadoChange = async (proyecto, nuevoEstado, skipConfirm = false) => {
    setActionError("");
    const allowedTransitions = getMecanicoAllowedTransitions(proyecto?.estado);
    if (!allowedTransitions.includes(nuevoEstado)) {
      setActionError("Transición de estado no permitida para mecánico.");
      return;
    }

    if (nuevoEstado !== proyecto?.estado && !hasApprovedQuote(proyecto)) {
      setActionError("No puedes cambiar el estado sin cotización aprobada por el cliente.");
      return;
    }

    if (nuevoEstado === "terminado" && !skipConfirm) {
      setEstadoConfirm({ proyecto, nuevoEstado });
      return;
    }

    await supabase
      .from("proyectos")
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq("id", proyecto.id);
    setProyectos((prev) =>
      prev.map((p) => p.id === proyecto.id ? { ...p, estado: nuevoEstado } : p)
    );

    await notifyClientStateChange({
      proyectoId: proyecto.id,
      clienteId: proyecto.cliente_id,
      tituloProyecto: proyecto.titulo,
      nuevoEstado: nuevoEstado,
      session,
    });
  };

  const [detalle, setDetalle] = useState(null);

  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className={`text-lg font-semibold ${t}`}>Mis Proyectos Asignados</h2>
          <p className={`text-xs ${st} mt-0.5`}>{proyectos.length} en total</p>
        </div>
      </div>
      {actionError && <p className="mb-3 text-sm" style={{ color: C_RED }}>{actionError}</p>}

      {/* Stats strip */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-4 no-scrollbar pr-4">
        {/* Card Todos */}
        <Card key="todos" darkMode={darkMode}
          className={`px-2 py-2.5 text-center cursor-pointer transition-all hover:scale-[1.02] flex-1 min-w-[85px] max-w-[160px] flex flex-col justify-center items-center ${filterEstado === "todos" ? (darkMode ? "ring-2 ring-blue-500 bg-blue-500/10" : "ring-2 ring-blue-500 bg-blue-50") : ""}`}
          onClick={() => setFilterEstado("todos")}
        >
          <p className={`text-base font-bold ${t}`}>{proyectos.length}</p>
          <p className={`text-[10px] uppercase tracking-wider font-semibold ${st} mt-1`}>Todos</p>
        </Card>

        {ESTADOS_PROYECTO.map((e) => {
          const count = proyectos.filter((p) => p.estado === e).length;
          const isActive = filterEstado === e;
          const badgeColors = estadoBadge(e, darkMode).split(" ")[1];
          
          return (
            <Card key={e} darkMode={darkMode}
              className={`px-2 py-2.5 text-center cursor-pointer transition-all hover:scale-[1.02] flex-1 min-w-[85px] max-w-[160px] flex flex-col justify-center items-center ${isActive ? (darkMode ? "ring-2 ring-blue-500 bg-blue-500/10" : "ring-2 ring-blue-500 bg-blue-50") : ""}`}
              onClick={() => setFilterEstado(e === filterEstado ? "todos" : e)}
            >
              <p className={`text-base font-bold ${badgeColors}`}>{count}</p>
              <p className={`text-[9px] uppercase tracking-wider font-semibold ${st} mt-1 truncate w-full px-1`}>{e.replace(/_/g, " ")}</p>
            </Card>
          );
        })}
      </div>

      <Card darkMode={darkMode} className="overflow-hidden">
        {loading ? (
          <div className={`p-12 text-center ${st} text-sm`}>Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className={`p-12 text-center ${st} text-sm`}>Sin proyectos asignados.</div>
        ) : (
          <div className={`divide-y ${divider}`}>
            {filtered.map((p) => (
              <div key={p.id} className={`px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-4 transition-colors ${darkMode ? "hover:bg-[#25252f]" : "hover:bg-gray-50"}`}>
                <div className="flex-1 cursor-pointer" onClick={() => setDetalle(p)}>
                  {(() => {
                    const cot = getLatestCotizacion(p);
                    if (!cot) return null;
                    return (
                      <p className={`text-[10px] uppercase tracking-wider mb-1 ${cot.estado === "aprobada" ? "text-emerald-500" : cot.estado === "rechazada" ? "text-red-500" : "text-amber-500"}`}>
                        Cotización {cot.estado}
                      </p>
                    );
                  })()}
                  <div className="flex items-center gap-2 mb-1">
                    {p.bloqueado && <span className="text-amber-500 text-xs">🔒</span>}
                    <p className={`font-semibold ${t}`}>{p.titulo}</p>
                  </div>
                  {p.descripcion && <p className={`text-xs ${st} mb-1`}>{p.descripcion}</p>}
                  <p className={`text-xs ${st}`}>
                    Cliente: {p.clientes?.nombre || "—"} ·{" "}
                    {p.vehiculos ? `${p.vehiculos.marca} ${p.vehiculos.modelo} · ${p.vehiculos.placas}` : "—"}
                  </p>
                  <p className={`text-xs ${st} mt-0.5`}>Ingreso: {fmtDate(p.fecha_ingreso)} · <span className="underline">Ver fotos →</span></p>
                </div>
                <div className="flex flex-col gap-2 items-start sm:items-end">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border capitalize ${estadoBadge(p.estado, darkMode)}`}>
                    {p.estado.replace(/_/g, " ")}
                  </span>
                  {(() => {
                    const options = getMecanicoAllowedTransitions(p.estado);
                    if (options.length <= 1) return null;
                    return (
                      <select
                        className={`text-xs rounded px-2 py-1 border outline-none ${darkMode ? "bg-[#2a2a35] border-zinc-700 text-zinc-300" : "bg-gray-50 border-gray-200 text-gray-700"}`}
                        value={p.estado}
                        onChange={(e) => handleEstadoChange(p, e.target.value)}
                      >
                        {options.map((s) => (
                          <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <ProyectoDetalleModal
        open={!!detalle} onClose={() => setDetalle(null)}
        proyecto={detalle} darkMode={darkMode}
        canUpload={false} session={session} diagnosticoFormatoBasico={true}
      />

      <ConfirmModal
        open={!!estadoConfirm}
        onClose={() => setEstadoConfirm(null)}
        title="Confirmar estado terminado"
        message="¿Confirmas que deseas marcar este proyecto como <strong>terminado</strong>?"
        onConfirm={() => {
          const proyecto = estadoConfirm?.proyecto;
          const next = estadoConfirm?.nuevoEstado;
          setEstadoConfirm(null);
          if (proyecto && next) {
            handleEstadoChange(proyecto, next, true);
          }
        }}
        confirmLabel="Marcar terminado"
        confirmColor={C_BLUE}
        darkMode={darkMode}
      />
    </div>
  );
};

// ─── Módulo Refacciones Mecánico (solo lectura + consulta de stock) ────────────
const RefaccionesMecanicoModule = ({ darkMode }) => {
  const [refacciones, setRefacciones] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("refacciones")
        .select("id,nombre,numero_parte,precio_venta,stock,stock_minimo,activo")
        .eq("activo", true)
        .order("nombre");
      setRefacciones(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = refacciones.filter((r) =>
    r.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    r.numero_parte?.toLowerCase().includes(search.toLowerCase())
  );

  const t  = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";
  const divider = darkMode ? "divide-zinc-800" : "divide-gray-100";

  const stockBadge = (r) => {
    if (r.stock === 0)              return darkMode ? "bg-red-900/40 text-red-400 border-red-800"     : "bg-red-50 text-red-700 border-red-200";
    if (r.stock <= r.stock_minimo)  return darkMode ? "bg-amber-900/40 text-amber-400 border-amber-800" : "bg-amber-50 text-amber-700 border-amber-200";
    return darkMode ? "bg-emerald-900/40 text-emerald-400 border-emerald-800" : "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <div className="mb-6">
        <h2 className={`text-lg font-semibold ${t}`}>Inventario de Refacciones</h2>
        <p className={`text-xs ${st} mt-0.5`}>{refacciones.length} refacciones</p>
      </div>
      <div className="mb-4">
        <Input darkMode={darkMode} icon="search" placeholder="Buscar por nombre o número de parte…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <Card darkMode={darkMode} className="overflow-hidden">
        {loading ? (
          <div className={`p-12 text-center ${st} text-sm`}>Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className={`p-12 text-center ${st} text-sm`}>Sin resultados</div>
        ) : (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b text-xs uppercase tracking-wider ${darkMode ? "text-zinc-500 border-zinc-800" : "text-gray-400 border-gray-100"}`}>
                  {["Nombre","N° Parte","Precio Venta","Stock","Estado"].map((h, i) => (
                    <th key={i} className="px-5 py-3 font-medium text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${divider}`}>
                {filtered.map((r) => (
                  <tr key={r.id} className={darkMode ? "hover:bg-[#25252f]" : "hover:bg-gray-50"}>
                    <td className={`px-5 py-3 font-medium ${t}`}>{r.nombre}</td>
                    <td className={`px-5 py-3 font-mono text-xs ${st}`}>{r.numero_parte || "—"}</td>
                    <td className={`px-5 py-3 ${st}`}>${r.precio_venta?.toFixed(2)}</td>
                    <td className={`px-5 py-3 font-semibold ${t}`}>{r.stock}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${stockBadge(r)}`}>
                        {r.stock === 0 ? "Sin stock" : r.stock <= r.stock_minimo ? "Stock bajo" : "Disponible"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

// ─── Módulo Notificaciones (comun) ──────────────────────────────────────────
const NotificacionesModule = ({ darkMode, notificaciones, loading, onMarkRead, onMarkAllRead }) => {
  const t  = darkMode ? "text-zinc-100" : "text-gray-800";
  const st = darkMode ? "text-zinc-500" : "text-gray-400";
  const divider = darkMode ? "divide-zinc-800" : "divide-gray-100";

  return (
    <div className={`flex-1 p-4 md:p-6 min-h-full page-enter ${darkMode ? "bg-[#16161e]" : "bg-gray-50"}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-lg font-semibold ${t}`}>Notificaciones</h2>
          <p className={`text-xs ${st} mt-0.5`}>{notificaciones.length} en total</p>
        </div>
        {onMarkAllRead && notificaciones.some((n) => !n.leida) && (
          <button
            onClick={onMarkAllRead}
            className={`text-xs px-3 py-1.5 rounded-md border ${darkMode ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
          >
            Marcar todas como leidas
          </button>
        )}
      </div>

      <Card darkMode={darkMode} className="overflow-hidden">
        {loading ? (
          <div className={`p-12 text-center ${st} text-sm`}>Cargando…</div>
        ) : notificaciones.length === 0 ? (
          <div className={`p-12 text-center ${st} text-sm`}>No hay notificaciones</div>
        ) : (
          <div className={`divide-y ${divider}`}>
            {notificaciones.map((n) => (
              <div key={n.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold ${t}`}>{n.titulo}</p>
                    {!n.leida && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${darkMode ? "bg-blue-900/50 text-blue-200 border-blue-800" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                        Nuevo
                      </span>
                    )}
                  </div>
                  <p className={`text-xs ${st} mt-1`}>{n.mensaje}</p>
                  <p className={`text-[10px] ${st} mt-2`}>{formatDateTimeWorkshop(n.created_at)}</p>
                </div>
                {!n.leida && onMarkRead && (
                  <button
                    onClick={() => onMarkRead(n.id)}
                    className={`text-xs px-3 py-1.5 rounded-md border ${darkMode ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                  >
                    Marcar como leida
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

// ─── Dashboard Mecánico ───────────────────────────────────────────────────────
const DashboardMecanico = ({ session, darkMode }) => {
  const [activeModule, setActiveModule] = useState("citas");
  const [empleadoId,   setEmpleadoId]   = useState(null);
  const [notifProjectId, setNotifProjectId] = useState(null);

  const handleNotificationClick = (n) => {
    if (n.proyecto_id) {
      setNotifProjectId(n.proyecto_id);
      setActiveModule("proyectos-mecanico");
    }
  };

  useEffect(() => {
    const loadEmpleado = async () => {
      const { data } = await supabase
        .from("empleados")
        .select("id")
        .eq("correo", session.user.email)
        .maybeSingle();
      if (data?.id) setEmpleadoId(data.id);
    };
    loadEmpleado();
  }, [session]);

  const navItems = [
    { id: "citas",              label: "Citas",          icon: <LucideIcon name="calendar" /> },
    { id: "proyectos-mecanico", label: "Mis Proyectos",  icon: <LucideIcon name="tool" /> },
    { id: "inventario", label: "Inventario", icon: <LucideIcon name="box" /> },
  ];

  return (
    <DashboardShell session={session} darkMode={darkMode} navItems={navItems} activeModule={activeModule} setActiveModule={setActiveModule} rolLabel="Mecánico" onNotificationClick={handleNotificationClick}>
      {activeModule === "proyectos-mecanico" && <ProyectosMecanicoModule darkMode={darkMode} empleadoId={empleadoId} session={session} initialProjectId={notifProjectId} />}
      {activeModule === "citas" && <CitasModule darkMode={darkMode} role="mecanico" canManage />}
      {activeModule === "inventario" && <GestionInventario darkMode={darkMode} role="mecanico" />}
    </DashboardShell>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [session,     setSession]     = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(
    () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setDarkMode(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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

  const rol = getRoleFromSession(session);

  const renderDashboard = () => {
    if (rol === "mecanico")       return <DashboardMecanico session={session} darkMode={darkMode} />;
    if (rol === "cliente")        return <DashboardCliente  session={session} darkMode={darkMode} />;
    return                               <Dashboard         session={session} darkMode={darkMode} />;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"              element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/completar-registro" element={<CompletarRegistro />} />
        <Route path="/cambiar-contrasena" element={<CambiarContrasena />} />
        <Route path="/dashboard"          element={<ProtectedRoute session={session}><ErrorBoundary>{renderDashboard()}</ErrorBoundary></ProtectedRoute>} />
        <Route path="/ticket/:proyectoId" element={<ProtectedRoute session={session}><TicketWrapper darkMode={darkMode} /></ProtectedRoute>} />
        <Route path="*"                   element={<Navigate to={session ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}