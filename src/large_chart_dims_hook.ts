/*
This code defines two custom hooks, useLargeChartDimensions and useViewportDimensions, 
which help in making the ECharts component responsive by adjusting its dimensions based on the viewport size.
The getViewportDimensions function retrieves the current dimensions of the viewport.
*/

'use client';
// Indicates that this module is to be used on the client-side.

import { useState, useEffect } from 'react';
// Imports useState and useEffect hooks from React.

import { SCREEN_LARGE, SCREEN_MEDIUM, SCREEN_SMALL } from './util';
// Imports constants for screen size breakpoints.

import { ViewportDimensions } from './util';
// Imports the ViewportDimensions type from the util module.

export default function useLargeChartDimensions() {
  // A custom hook to calculate dimensions for a large chart based on the viewport size.

  const viewportDimensions = useViewportDimensions();
  // Calls the useViewportDimensions hook to get the current viewport dimensions.

  let { height: eChartsHeight, width: eChartsWidth } = viewportDimensions;
  // Destructures height and width from viewportDimensions.

  // Sets default dimensions for mobile view.
  eChartsWidth = viewportDimensions.width * 0.95;
  eChartsHeight = viewportDimensions.height * 0.7;

  // Adjusts dimensions based on screen size.
  if (viewportDimensions.width >= SCREEN_SMALL) {
    eChartsWidth = 600;
    eChartsHeight = 500;
  }
  if (viewportDimensions.width >= SCREEN_MEDIUM) {
    eChartsWidth = 750;
    eChartsHeight = 600;
  }
  if (viewportDimensions.width >= SCREEN_LARGE) {
    eChartsWidth = 950;
    eChartsHeight = 700;
  }

  return { eChartsWidth, eChartsHeight };
  // Returns the calculated width and height for the chart.
}

export function useViewportDimensions() {
  // A custom hook to get and manage the viewport dimensions.

  const [viewportDimensions, setViewportDimensions] = useState(getViewportDimensions());
  // Initializes the state with the current viewport dimensions.

  useEffect(() => {
    // Sets up an effect to handle window resize events.

    function handleResize() {
      setViewportDimensions(getViewportDimensions());
      // Updates the state with the new viewport dimensions when the window is resized.
    }

    window.addEventListener('resize', handleResize);
    // Adds the resize event listener.

    return () => {
      window.removeEventListener('resize', handleResize);
      // Cleans up the event listener on component unmount.
    };
  }, []);

  return viewportDimensions;
  // Returns the current viewport dimensions.
}

export function getViewportDimensions(): ViewportDimensions {
  // A function to get the current viewport dimensions.

  if (typeof window === 'undefined') {
    return { width: 380, height: 350 };
    // Returns default dimensions if window is not defined (e.g., during server-side rendering).
  }

  const { innerWidth: width, innerHeight: height } = window;
  // Destructures innerWidth and innerHeight from the window object.

  return { width, height };
  // Returns the viewport dimensions.
}
