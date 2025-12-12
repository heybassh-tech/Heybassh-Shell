import { useState, useEffect, useRef } from "react";
import { Modal } from "antd";
import { DatePicker } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { PrimaryButton } from "../../../../PrimaryButton";
import { PrimaryInput } from "../../../../PrimaryInput";

interface DateRangePopupProps {
  open: boolean;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  onClose: () => void;
  onSelect: (startDate: Dayjs | null, endDate: Dayjs | null) => void;
}

export function DateRangePopup({
  open,
  startDate,
  endDate,
  onClose,
  onSelect,
}: DateRangePopupProps) {
  const [localStartDate, setLocalStartDate] = useState<Dayjs | null>(startDate);
  const [localEndDate, setLocalEndDate] = useState<Dayjs | null>(endDate);
  const [startDateInput, setStartDateInput] = useState(
    startDate ? startDate.format("YYYY-MM-DD") : ""
  );
  const [endDateInput, setEndDateInput] = useState(
    endDate ? endDate.format("YYYY-MM-DD") : ""
  );
  const endDateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalStartDate(startDate);
    setLocalEndDate(endDate);
    setStartDateInput(startDate ? startDate.format("YYYY-MM-DD") : "");
    setEndDateInput(endDate ? endDate.format("YYYY-MM-DD") : "");
  }, [startDate, endDate, open]);

  const handleStartDateChange = (date: Dayjs | null) => {
    setLocalStartDate(date);
    setStartDateInput(date ? date.format("YYYY-MM-DD") : "");
    // Auto-focus end date input
    if (date && endDateInputRef.current) {
      setTimeout(() => {
        endDateInputRef.current?.focus();
      }, 100);
    }
  };

  const handleEndDateChange = (date: Dayjs | null) => {
    setLocalEndDate(date);
    setEndDateInput(date ? date.format("YYYY-MM-DD") : "");
  };

  const handleStartDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStartDateInput(value);
    const parsed = dayjs(value, "YYYY-MM-DD", true);
    if (parsed.isValid()) {
      setLocalStartDate(parsed);
      if (endDateInputRef.current) {
        setTimeout(() => {
          endDateInputRef.current?.focus();
        }, 100);
      }
    } else if (value === "") {
      setLocalStartDate(null);
    }
  };

  const handleEndDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEndDateInput(value);
    const parsed = dayjs(value, "YYYY-MM-DD", true);
    if (parsed.isValid()) {
      setLocalEndDate(parsed);
    } else if (value === "") {
      setLocalEndDate(null);
    }
  };

  const handleConfirm = () => {
    if (localStartDate && localEndDate) {
      onSelect(localStartDate, localEndDate);
    }
  };

  const handleClose = () => {
    setLocalStartDate(startDate);
    setLocalEndDate(endDate);
    setStartDateInput(startDate ? startDate.format("YYYY-MM-DD") : "");
    setEndDateInput(endDate ? endDate.format("YYYY-MM-DD") : "");
    onClose();
  };

  const canConfirm = localStartDate && localEndDate;

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      title="Select Date Range"
      width={500}
      centered
      maskClosable={false}
      destroyOnClose
      className="primary-modal"
    >
      <div className="space-y-4">
        {/* Calendar */}
        <div>
          <DatePicker.RangePicker
            value={[localStartDate, localEndDate]}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setLocalStartDate(dates[0]);
                setLocalEndDate(dates[1]);
                setStartDateInput(dates[0].format("YYYY-MM-DD"));
                setEndDateInput(dates[1].format("YYYY-MM-DD"));
              } else if (dates === null) {
                setLocalStartDate(null);
                setLocalEndDate(null);
                setStartDateInput("");
                setEndDateInput("");
              }
            }}
            format="YYYY-MM-DD"
            className="w-full"
            style={{
              width: "100%",
              borderRadius: "10px",
              borderColor: "#1a2446",
              backgroundColor: "#0e1629",
            }}
          />
        </div>

        {/* Date Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-blue-200 mb-2">
              Start Date
            </label>
            <PrimaryInput
              id="start-date"
              type="date"
              value={startDateInput}
              onChange={handleStartDateInputChange}
              placeholder="YYYY-MM-DD"
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-blue-200 mb-2">
              End Date
            </label>
            <PrimaryInput
              id="end-date"
              ref={endDateInputRef}
              type="date"
              value={endDateInput}
              onChange={handleEndDateInputChange}
              placeholder="YYYY-MM-DD"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-[10px] border border-[#1a2446] bg-[#0e1629] px-4 py-2 text-xs font-medium text-blue-200 transition-colors hover:bg-[#121c3d] hover:text-white"
          >
            Cancel
          </button>
          <PrimaryButton type="button" onClick={handleConfirm} disabled={!canConfirm}>
            Confirm
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

