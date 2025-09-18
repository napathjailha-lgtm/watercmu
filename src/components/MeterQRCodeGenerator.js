// src/components/MeterQRCodeGenerator.js
import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip'; // <-- เพิ่มการ import jszip
import { saveAs } from 'file-saver'; // <-- เพิ่มการ import file-saver

// --- ต้องตรวจสอบให้แน่ใจว่าไฟล์นี้มีอยู่จริงและชื่อตรงกัน ---
// ถ้าไฟล์ของคุณชื่อ Sarabun-Regular-normal.js และคุณต้องการใช้ชื่อนั้น
// ให้เปลี่ยนเป็น: import '../fonts/Sarabun-Regular-normal.js';
// ถ้าคุณเปลี่ยนชื่อไฟล์เป็น SarabunNew.js แล้ว ก็ใช้บรรทัดนี้ได้เลย:
import '../fonts/SarabunNew.js';

const MeterQRCodeGenerator = ({ meters, onGeneratePDF }) => {
    const qrCodeRefs = useRef({});
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [generatingPng, setGeneratingPng] = useState(false);
    const [generatingZip, setGeneratingZip] = useState(false); // <-- State สำหรับการสร้าง ZIP

    // --- หมายเหตุ ---
    // คุณต้องติดตั้งไลบรารีที่จำเป็นก่อน:
    // npm install jszip file-saver
    // หรือ
    // yarn add jszip file-saver

    const generateQRCodeData = (meter) => {
        return JSON.stringify({
            meter_id: meter.meter_id || meter.id,
            meter_number: meter.meter_number,
            location: meter.location,
            customer_name: meter.customer_name,
        });
    };

    const handleGeneratePdf = async () => {
        setGeneratingPdf(true);
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;

        const margin = 10;
        const qrCodeDesiredSize = 50;
        const itemSpacingY = 3.5;
        const textLinesHeight = itemSpacingY * 3; // 3 lines of text
        const spacingBetweenTextAndQr = 3;
        const spacingBetweenItems = 10;

        const itemWidth = qrCodeDesiredSize;
        const singleItemTotalHeight = textLinesHeight + spacingBetweenTextAndQr + qrCodeDesiredSize + spacingBetweenItems;

        const col1X = margin;
        const col2X = margin + itemWidth + spacingBetweenItems;

        let currentRow = 0;
        let currentCol = 0;

        const startNewPage = () => {
            doc.addPage();
            doc.setFont('THSarabunNew', 'normal');
            currentRow = 0;
            currentCol = 0;
        };

        doc.setFont('THSarabunNew', 'normal');

        for (const meter of meters) {
            const meterId = meter.id || meter.meter_id;
            const element = qrCodeRefs.current[meterId];

            if (element) {
                let yPos = margin + (currentRow * singleItemTotalHeight);
                let xPos = currentCol === 0 ? col1X : col2X;

                if (yPos + singleItemTotalHeight > pageHeight - margin && currentCol === 0) {
                    currentCol = 1;
                    yPos = margin + (currentRow * singleItemTotalHeight);
                    xPos = col2X;
                }

                if (yPos + singleItemTotalHeight > pageHeight - margin && currentCol === 1) {
                    startNewPage();
                    yPos = margin;
                    xPos = col1X;
                }

                doc.setFontSize(10);
                doc.text(`มิเตอร์: ${meter.meter_number}`, xPos, yPos);
                doc.text(`ผู้ใช้น้ำ: ${meter.customer_name || '-'}`, xPos, yPos + itemSpacingY);
                doc.text(`ตำแหน่ง: ${meter.location || '-'}`, xPos, yPos + (itemSpacingY * 2));

                const canvas = await html2canvas(element, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');

                doc.addImage(imgData, 'PNG', xPos, yPos + (itemSpacingY * 2) + spacingBetweenTextAndQr, qrCodeDesiredSize, qrCodeDesiredSize);

                if (currentCol === 0) {
                    currentCol = 1;
                } else {
                    currentCol = 0;
                    currentRow++;
                }
            }
        }
        doc.save(`QR_Codes_Meters_${new Date().toLocaleDateString('th-TH')}.pdf`);
        setGeneratingPdf(false);
        if (onGeneratePDF) onGeneratePDF();
    };

    const handleGeneratePng = async (meter) => {
        setGeneratingPng(true);
        const meterId = meter.id || meter.meter_id;
        const element = qrCodeRefs.current[meterId];

        if (element) {
            try {
                const tempText = document.createElement('p');
                tempText.textContent = `${meter.meter_number}`;
                
                tempText.style.textAlign = 'center';
                tempText.style.marginTop = '10px';
                element.appendChild(tempText);

                const canvas = await html2canvas(element, { scale: 3 });
                const imgDataUrl = canvas.toDataURL('image/png');

                // ลบข้อความหลัง render
                element.removeChild(tempText);

                const link = document.createElement('a');
                link.href = imgDataUrl;
                link.download = `QR_Code_${meter.meter_number}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

            } catch (error) {
                console.error("Error generating PNG for meter:", meter.meter_number, error);
                alert(`เกิดข้อผิดพลาดในการสร้าง QR Code PNG สำหรับมิเตอร์ ${meter.meter_number}`);
            }
        }
        setGeneratingPng(false);
    };

    // <-- ฟังก์ชันใหม่สำหรับสร้างไฟล์ ZIP -->
    const handleGenerateZip = async () => {
        setGeneratingZip(true);
        const zip = new JSZip();

        for (const meter of meters) {
            const meterId = meter.id || meter.meter_id;
            const element = qrCodeRefs.current[meterId];

            if (element) {
                try {
                    // เพิ่มข้อความหมายเลขมิเตอร์เข้าไปใน div ชั่วคราวเพื่อ render
                    const tempText = document.createElement('p');
                    tempText.textContent = `${meter.meter_number}`;
                    tempText.style.fontFamily = 'sans-serif';
                    tempText.style.textAlign = 'center';
                    tempText.style.marginTop = '10px';
                    element.appendChild(tempText);

                    const canvas = await html2canvas(element, { scale: 3 });
                    
                    // ลบข้อความออกหลังจาก render เสร็จ
                    element.removeChild(tempText);

                    // แปลง canvas เป็น blob
                    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                    
                    // เพิ่มไฟล์ลงใน zip
                    zip.file(`QR_Code_${meter.meter_number}.png`, blob);

                } catch (error) {
                     console.error("Error creating canvas for meter:", meter.meter_number, error);
                }
            }
        }

        // สร้างไฟล์ zip และเริ่มการดาวน์โหลด
        zip.generateAsync({ type: 'blob' }).then((content) => {
            saveAs(content, `QR_Codes_Meters_${new Date().toLocaleDateString('th-TH')}.zip`);
        });

        setGeneratingZip(false);
    };

    if (!meters || meters.length === 0) {
        return (
            <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-700 p-4 rounded mb-4">
                <p>ไม่พบข้อมูลมิเตอร์สำหรับสร้าง QR Code</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <h2 className="text-xl font-semibold mb-4">สร้าง QR Code สำหรับมิเตอร์</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {meters.map((meter) => {
                    const meterId = meter.id || meter.meter_id;
                    const qrCodeValue = generateQRCodeData(meter);
                    return (
                        <div
                            key={meterId}
                            className="border p-4 rounded-lg shadow-sm flex flex-col items-center"
                        >
                            <h3 className="text-lg font-medium text-gray-800 mb-2">{meter.meter_number}</h3>
                            <p className="text-sm text-gray-600 mb-2">{meter.customer_name}</p>
                            <div
                                ref={(el) => (qrCodeRefs.current[meterId] = el)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    padding: 20,
                                    backgroundColor: 'white', // ให้มีพื้นหลังขาวใน PNG
                                }}
                            >
                                <QRCodeCanvas
                                    value={qrCodeValue}
                                    size={128}
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">ID: {meterId}</p>
                            <button
                                onClick={() => handleGeneratePng(meter)}
                                className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded text-sm transition-colors disabled:opacity-50 flex items-center justify-center"
                                disabled={generatingPng}
                            >
                                {generatingPng ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        กำลังสร้าง...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                        Export PNG
                                    </>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="text-center flex flex-col md:flex-row justify-center items-center gap-4">
                <button
                    onClick={handleGeneratePdf}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 flex items-center justify-center w-full md:w-auto"
                    disabled={generatingPdf || generatingZip}
                >
                    {generatingPdf ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            กำลังสร้าง PDF...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l3-3m-3 3l-3-3m-3 8h6a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            ส่งออกทั้งหมดเป็น PDF
                        </>
                    )}
                </button>
                {/* <-- ปุ่มใหม่สำหรับสร้าง ZIP --> */}
                <button
                    onClick={handleGenerateZip}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 flex items-center justify-center w-full md:w-auto"
                    disabled={generatingZip || generatingPdf}
                >
                    {generatingZip ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            กำลังสร้าง ZIP...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                            ส่งออกทั้งหมดเป็น ZIP
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default MeterQRCodeGenerator;
