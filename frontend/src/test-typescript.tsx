/**
 * This is a test TypeScript file to verify Phase 0 setup.
 * It will be removed in Phase 1.
 */

// Test React TypeScript functionality
import React from "react";

interface TestProps {
  message: string;
  count?: number;
}

const TestComponent: React.FC<TestProps> = ({ message, count = 0 }) => {
  return (
    <div>
      <h1>{message}</h1>
      <p>Count: {count}</p>
    </div>
  );
};

export default TestComponent;
