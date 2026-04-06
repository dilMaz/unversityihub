import React from "react";

function AdminFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="adm-footer">
      <div className="adm-footer-inner">
        <span>UniHub Admin Console</span>
        <span>{`Copyright ${currentYear} UniHub. All rights reserved.`}</span>
      </div>
    </footer>
  );
}

export default AdminFooter;
