import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    const range = (start: number, end: number) => {
        return Array.from({ length: end - start + 1 }, (_, idx) => idx + start);
    };

    const getPageNumbers = (): (number | string)[] => {
        const pageNumbers: (number | string)[] = [];
        
        // Define the start and end page numbers
        const startPage = Math.max(2, currentPage - 1);
        const endPage = Math.min(totalPages - 1, currentPage + 1);
        
        // Always include the first page
        pageNumbers.push(1);

        // Handle ellipsis for the left gap
        if (startPage > 2) {
            pageNumbers.push('...');
        }

        // Range of pages around the current page
        for (const page of range(startPage, endPage)) {
            if (page <= totalPages && page >= 1) {
                pageNumbers.push(page);
            }
        }

        // Handle ellipsis for the right gap
        if (endPage < totalPages - 1) {
            pageNumbers.push('...');
        }

        // Always include the last page if we have more than one page
        if (totalPages > 1) {
            pageNumbers.push(totalPages);
        }

        return pageNumbers;
    };

    return (
        <div style={styles.container}>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={currentPage === 1 ? { ...styles.button, ...styles.disabledButton } : styles.button}
            >
                Prev
            </button>
            {getPageNumbers().map((page, index) => (
                <button
                    key={index}
                    style={currentPage === page ? { ...styles.button, ...styles.activeButton } : styles.button}
                    onClick={() => typeof page === 'number' && onPageChange(page)}
                    disabled={page === '...'}
                >
                    {page}
                </button>
            ))}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={currentPage === totalPages ? { ...styles.button, ...styles.disabledButton } : styles.button}
            >
                Next
            </button>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px',
        marginTop: '20px',
    },
    button: {
        padding: '5px 10px',
        border: '1px solid #ddd',
        backgroundColor: '#f8f8f8',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
    },
    activeButton: {
        backgroundColor: '#e0e0e0',
    },
    disabledButton: {
        cursor: 'default',
        opacity: 0.5,
    }
};

export default Pagination;
