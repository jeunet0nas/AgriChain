/**
 * Composable for formatting and displaying product tracking data
 * Includes helpers for addresses, dates, roles, events, etc.
 */
export function useTrackingHelpers() {
  /**
   * Format Ethereum address for display
   */
  function formatAddress(address) {
    if (!address) return "Chưa xác định";
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Format product type for display
   */
  function formatProductType(type) {
    const typeMap = {
      fruit: "Trái cây",
      vegetable: "Rau củ",
      grain: "Ngũ cốc",
      seafood: "Thủy sản",
      meat: "Thịt gia súc/gia cầm",
      other: "Khác",
    };
    return typeMap[type] || type;
  }

  /**
   * Format date for display (DD/MM/YYYY)
   */
  function formatDate(dateString) {
    if (!dateString) return "Chưa xác định";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  }

  /**
   * Get status label in Vietnamese
   */
  function getStatusLabel(status) {
    const statusMap = {
      HARVESTED: "Đã thu hoạch",
      INSPECTING: "Đã kiểm định",
      IN_TRANSIT: "Đang vận chuyển",
      DELIVERED: "Đã giao cho bán lẻ",
      RETAILED: "Đang bán lẻ",
      CONSUMED: "Đã tiêu thụ",
      RECALLED: "Đã thu hồi",
    };
    return statusMap[status] || status;
  }

  /**
   * Get role label in Vietnamese
   */
  function getRoleLabel(role) {
    const roleMap = {
      FARMER: "Nông dân",
      INSPECTOR: "Kiểm định viên",
      LOGISTICS: "Đơn vị vận chuyển",
      RETAILER: "Nhà bán lẻ",
      CONSUMER: "Người tiêu dùng",
      QUARANTINE: "Kho cách ly",
      ARCHIVE: "Kho lưu trữ",
    };
    return roleMap[role] || role;
  }

  /**
   * Get role color classes for Tailwind
   */
  function getRoleColor(role) {
    const colorMap = {
      FARMER: "bg-emerald-100 text-emerald-700",
      INSPECTOR: "bg-blue-100 text-blue-700",
      LOGISTICS: "bg-purple-100 text-purple-700",
      RETAILER: "bg-amber-100 text-amber-700",
      CONSUMER: "bg-slate-100 text-slate-700",
      QUARANTINE: "bg-red-100 text-red-700",
      ARCHIVE: "bg-slate-100 text-slate-700",
    };
    return colorMap[role] || "bg-slate-100 text-slate-700";
  }

  /**
   * Get event type label in Vietnamese
   */
  function getEventLabel(type) {
    const labelMap = {
      REGISTERED_ONCHAIN: "Đăng ký lô hàng",
      REGISTERED: "Đăng ký lô hàng",
      ATTESTED: "Kiểm định chất lượng",
      ATTEST: "Kiểm định chất lượng",
      TRANSFER: "Chuyển giao",
      STATUS_UPDATED: "Cập nhật trạng thái",
      RECALL: "Thu hồi sản phẩm",
      ARCHIVE: "Lưu trữ",
    };
    return labelMap[type] || type;
  }

  /**
   * Get event color class for timeline dots
   */
  function getEventColor(type) {
    const colorMap = {
      REGISTERED: "bg-emerald-500",
      REGISTERED_ONCHAIN: "bg-emerald-500",
      ATTESTED: "bg-blue-500",
      ATTEST: "bg-blue-500",
      TRANSFER: "bg-purple-500",
      STATUS_UPDATED: "bg-amber-500",
      RECALL: "bg-red-500",
      ARCHIVE: "bg-slate-500",
    };
    return colorMap[type] || "bg-slate-400";
  }

  /**
   * Get event text color class
   */
  function getEventTextColor(type) {
    const colorMap = {
      REGISTERED: "text-emerald-700",
      REGISTERED_ONCHAIN: "text-emerald-700",
      ATTESTED: "text-blue-700",
      ATTEST: "text-blue-700",
      TRANSFER: "text-purple-700",
      STATUS_UPDATED: "text-amber-700",
      RECALL: "text-red-700",
      ARCHIVE: "text-slate-700",
    };
    return colorMap[type] || "text-slate-700";
  }

  /**
   * Parse timestamp to milliseconds
   */
  function parseTimestamp(timestamp) {
    if (typeof timestamp === "number") {
      return timestamp;
    }
    if (typeof timestamp === "string") {
      return new Date(timestamp).getTime();
    }
    return 0;
  }

  /**
   * Sort and filter events for timeline display
   */
  function processEvents(events) {
    if (!events || events.length === 0) return [];

    return [...events]
      .filter((event) => {
        // Skip NOT_EXIST → HARVESTED transition (redundant with REGISTERED)
        return event.statusFrom !== "NOT_EXIST";
      })
      .sort((a, b) => {
        const timeA = parseTimestamp(a.timestamp);
        const timeB = parseTimestamp(b.timestamp);
        return timeB - timeA; // Newest first
      });
  }

  return {
    formatAddress,
    formatProductType,
    formatDate,
    getStatusLabel,
    getRoleLabel,
    getRoleColor,
    getEventLabel,
    getEventColor,
    getEventTextColor,
    parseTimestamp,
    processEvents,
  };
}
