import React, { useEffect } from 'react';
import HyperUXSDK from './hyperux-sdk';

function traverseComponentTree(component) {
  const componentName = component.type.name || component.type.displayName || 'UnknownComponent';
  const props = Object.keys(component.props).reduce((acc, propKey) => {
    acc[propKey] = component.props[propKey];
    return acc;
  }, {});

  const result = {
    component: componentName,
    props: props,
    children: []
  };

  React.Children.forEach(component.props.children, child => {
    if (React.isValidElement(child)) {
      result.children.push(traverseComponentTree(child));
    }
  });

  return result;
}

export function useLayoutCapture(rootComponent, storageKey = 'layout_json') {
  useEffect(() => {
    const layoutCaptured = sessionStorage.getItem(storageKey);
    if (!layoutCaptured) {
      const layout = traverseComponentTree(rootComponent);
      console.log('Captured Layout:', layout);
      sessionStorage.setItem(storageKey, JSON.stringify(layout));
    }
  }, [rootComponent, storageKey]);
}

export function withLayoutCapture(WrappedComponent, storageKey) {
  return function LayoutCaptureWrapper(props) {
    const rootComponent = <WrappedComponent {...props} />;
    useLayoutCapture(rootComponent, storageKey);
    return rootComponent;
  };
}

export function withHyperUX(WrappedComponent) {
  return function HyperUXWrapper(props) {
    const hyperUX = new HyperUXSDK({
      apiKey: 'api-key-111',
      serverUrl: 'ws://localhost:8080'
    });

    useEffect(() => {
      const handleEvent = (event) => {
        hyperUX.captureEvent(event.type, {
          element: event.target.tagName,
          id: event.target.id,
          classes: event.target.className,
          x: event.clientX,
          y: event.clientY,
        });
      };

      document.addEventListener('click', handleEvent);
      document.addEventListener('submit', handleEvent);

      return () => {
        document.removeEventListener('click', handleEvent);
        document.removeEventListener('submit', handleEvent);
      };
    }, []);

    const rootComponent = <WrappedComponent {...props} />;
    useLayoutCapture(rootComponent);

    return rootComponent;
  };
}
