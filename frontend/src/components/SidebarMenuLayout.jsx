// Begin SidebarMenuLayout.jsx

import React from 'react';

const SidebarMenuLayout = ({ children }) => {
    return (
        <aside className="sidebar">
            <div className="sidebar-content">
                {children}
            </div>
        </aside>
    )
};

export default SidebarMenuLayout;

// Add custom styles for the sidebar
<style jsx>{`
    .sidebar {
        width: 250px;
        min-height: 100vh;
        background-color: #1e293b;
        color: white;
        padding: 1rem;
        position: fixed;
    }
    .sidebar-content {
        display: flex;
        flex-direction: column;
    }
    /* Responsive Design */
    @media (max-width: 768px) {
        .sidebar {
            width: 100%;
            height: auto;
            position: static;
        }
    }
`}</style>

// End SidebarMenuLayout.jsx