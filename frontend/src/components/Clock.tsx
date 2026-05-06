import { useState, useEffect } from "react";
import api from "../services/api";

export default function Clock() {
  const [timeStr, setTimeStr] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");
  const [timezone, setTimezone] = useState<string>("Australia/Sydney");

  useEffect(() => {
    const fetchTimezone = async () => {
      try {
        const response = await api.get("/restaurant");
        if (response.data?.timezone) {
          // Normalize timezone values if they have visual descriptive text
          let rawTz = response.data.timezone;
          if (rawTz.includes("Sydney")) rawTz = "Australia/Sydney";
          else if (rawTz.includes("Melbourne")) rawTz = "Australia/Melbourne";
          else if (rawTz.includes("Brisbane")) rawTz = "Australia/Brisbane";
          else if (rawTz.includes("Adelaide")) rawTz = "Australia/Adelaide";
          else if (rawTz.includes("Perth")) rawTz = "Australia/Perth";
          else if (rawTz.includes("Hobart")) rawTz = "Australia/Hobart";
          else if (rawTz.includes("Darwin")) rawTz = "Australia/Darwin";
          
          setTimezone(rawTz);
        }
      } catch (err) {
        console.error("Failed to load restaurant timezone", err);
      }
    };

    void fetchTimezone();
  }, []);

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        
        const timeFormatter = new Intl.DateTimeFormat("en-AU", {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        });

        const dateFormatter = new Intl.DateTimeFormat("en-AU", {
          timeZone: timezone,
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

        setTimeStr(timeFormatter.format(now));
        setDateStr(dateFormatter.format(now));
      } catch (err) {
        const now = new Date();
        setTimeStr(now.toLocaleTimeString("en-AU"));
        setDateStr(now.toLocaleDateString("en-AU"));
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  return (
    <div className="flex flex-col items-center lg:items-end font-mono select-none">
      <span className="text-[14px] font-black text-[#0c1424] tracking-tight leading-none">
        {timeStr || "--:--:--"}
      </span>
      <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-wider whitespace-nowrap">
        {dateStr || "Loading..."}
      </span>
    </div>
  );
}
