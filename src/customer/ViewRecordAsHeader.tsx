'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import { getObjectRecords } from './../apiService';

// COMPACT TYPOGRAPHY & SPACING CONSTANTS
const COMPACT_FONT_SIZE = 11;
const COMPACT_PADDING = 2;
const COMPACT_MARGIN = 2;

export interface ColumnSchema {
    id?: string;
    col_name: string;
    label?: string;
    html_type?: string;
    seq?: number;
    [key: string]: any;
}

export interface ViewRecordAsHeaderProps {
    objectid: string;
    id: string;
}

/**
 * Extracts and displays only the 'text value' from '[varchar value] text value'
 */
function parseDisplayValue(raw: any): string {
    if (raw === null || raw === undefined || raw === '') return '—';
    if (typeof raw === 'boolean') return raw ? 'Yes' : 'No';

    const str = String(raw).trim();
    if (str.startsWith('[')) {
        const match = str.match(/^\[(.*?)\]\s*(.*)$/);
        if (match) {
            return match[2] && match[2].trim().length > 0 ? match[2].trim() : match[1];
        }
    }

    return str;
}

export const ViewRecordAsHeader: React.FC<ViewRecordAsHeaderProps> = ({
    objectid,
    id,
}) => {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const [columns, setColumns] = useState<ColumnSchema[]>([]);
    const [recordData, setRecordData] = useState<Record<string, any> | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const loadRecord = async () => {
        const trimmedObjectId = objectid?.trim();
        const trimmedId = String(id || '').trim();

        if (!trimmedObjectId || !trimmedId) {
            setRecordData(null);
            setColumns([]);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await getObjectRecords({
                objectid: trimmedObjectId,
                whereClause: [{ col_name: 'id', value: trimmedId }],
                filterColumns: [],
            });

            let rawResponse = response;
            if (typeof response === 'string') {
                try {
                    rawResponse = JSON.parse(response);
                } catch {
                    // ignore parsing error
                }
            }

            if (rawResponse?.success === false) {
                throw new Error(rawResponse.error || 'Failed to fetch record data.');
            }

            // 1. Resolve columns metadata
            const fetchedColumns: ColumnSchema[] =
                rawResponse?.columns?.columns ||
                rawResponse?.columns ||
                rawResponse?.data?.columns ||
                [];

            // 2. Resolve data payload
            let fetchedRecord: Record<string, any> | null = null;
            const dataArray = rawResponse?.data || rawResponse?.rows || [];

            if (Array.isArray(dataArray) && dataArray.length > 0) {
                fetchedRecord = dataArray[0];
            } else if (dataArray && typeof dataArray === 'object' && !Array.isArray(dataArray)) {
                fetchedRecord = dataArray;
            }

            setRecordData(fetchedRecord);

            if (fetchedColumns.length > 0) {
                setColumns(fetchedColumns);
            } else if (fetchedRecord) {
                const fallbackCols: ColumnSchema[] = Object.keys(fetchedRecord).map((key) => ({
                    col_name: key,
                    label: key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
                }));
                setColumns(fallbackCols);
            }
        } catch (err: any) {
            console.error('Error in ViewRecordAsHeader:', err);
            setError(err?.message || 'Error loading header record.');
            setRecordData(null);
            setColumns([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRecord();
    }, [objectid, id]);

    // Chunk columns into pairs (left & right columns)
    const columnPairs = useMemo(() => {
        const pairs: ColumnSchema[][] = [];
        for (let i = 0; i < columns.length; i += 2) {
            pairs.push(columns.slice(i, i + 2));
        }
        return pairs;
    }, [columns]);

    const renderField = (col: ColumnSchema) => {
        const key = col.col_name?.toLowerCase();
        const rawVal = recordData ? recordData[key] ?? recordData[col.col_name] : '—';
        const displayVal = parseDisplayValue(rawVal);
        const labelText = col.label;

        return (
            <View style={[styles.fieldContainer, isDesktop && styles.desktopCompactField]}>
                <Text style={[styles.fieldLabel, isDesktop && styles.desktopCompactLabel]}>
                    {labelText?.toUpperCase()}
                </Text>
                <Text style={[styles.fieldValue, isDesktop && styles.desktopCompactValue]}>
                    {displayVal}
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centerBox]}>
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text style={styles.loadingText}>Loading header data...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.centerBox]}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    if (!recordData || columns.length === 0) {
        return null;
    }

    return (
        <View style={[styles.container, isDesktop && styles.desktopCompactContainer]}>
            {columnPairs.map((pair, rowIndex) => (
                <View
                    key={`row-${rowIndex}`}
                    style={[styles.rowContainer, isDesktop && styles.desktopCompactRow]}
                >
                    {/* Left Column */}
                    <View style={[styles.columnHalf, styles.columnLeft]}>
                        {renderField(pair[0])}
                    </View>

                    {/* Right Column */}
                    <View style={[styles.columnHalf, styles.columnRight]}>
                        {pair[1] ? renderField(pair[1]) : <View style={styles.emptyPlaceholder} />}
                    </View>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderWidth: 0.5,
        borderColor: '#0F172A',
        borderRadius: 4,
        padding: 8,
        marginVertical: 4,
        overflow: 'hidden',
    },
    desktopCompactContainer: {
        padding: COMPACT_PADDING * 2,
        marginVertical: COMPACT_MARGIN,
        borderRadius: 2,
    },
    centerBox: {
        minHeight: 60,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    loadingText: {
        fontSize: COMPACT_FONT_SIZE,
        color: '#64748B',
    },
    errorText: {
        fontSize: COMPACT_FONT_SIZE,
        color: '#EF4444',
        fontWeight: '500',
    },
    rowContainer: {
        flexDirection: 'row',
        width: '100%',
        borderBottomWidth: 0.5,
        borderBottomColor: '#F1F5F9',
        paddingVertical: 4,
    },
    desktopCompactRow: {
        paddingVertical: COMPACT_PADDING,
    },
    columnHalf: {
        flex: 1,
    },
    columnLeft: {
        paddingRight: 8,
        borderRightWidth: 0.5,
        borderRightColor: '#F1F5F9',
    },
    columnRight: {
        paddingLeft: 8,
    },
    emptyPlaceholder: {
        flex: 1,
    },
    fieldContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
    },
    desktopCompactField: {
        margin: COMPACT_MARGIN,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 1,
    },
    desktopCompactLabel: {
        fontSize: COMPACT_FONT_SIZE,
    },
    fieldValue: {
        fontSize: 13,
        color: '#0F172A',
        fontWeight: '400',
    },
    desktopCompactValue: {
        fontSize: COMPACT_FONT_SIZE,
    },
});

ViewRecordAsHeader.displayName = 'ViewRecordAsHeader';

export default ViewRecordAsHeader;