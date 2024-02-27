import { useConst, useForceUpdate } from '@fluentui/react-hooks';
import * as React from 'react';
import { IObjectWithKey, IRenderFunction, SelectionMode } from '@fluentui/react/lib/Utilities';
import { ConstrainMode, DetailsList, DetailsListLayoutMode, DetailsRow, IColumn, IDetailsCheckboxProps, IDetailsHeaderProps, IDetailsListProps, IDetailsRowStyles } from '@fluentui/react/lib/DetailsList';
import { Sticky, StickyPositionType } from '@fluentui/react/lib/Sticky';
import { ContextualMenu, DirectionalHint, IContextualMenuProps } from '@fluentui/react/lib/ContextualMenu';
import { ScrollablePane, ScrollbarVisibility } from '@fluentui/react/lib/ScrollablePane';
import { Stack } from '@fluentui/react/lib/Stack';
import { Overlay } from '@fluentui/react/lib/Overlay';
import { IconButton } from '@fluentui/react/lib/Button';
import { Selection } from '@fluentui/react/lib/Selection';
import { Link } from '@fluentui/react/lib/Link';
import { Text } from '@fluentui/react/lib/Text';
import { Checkbox } from '@fluentui/react';

type DataSet = ComponentFramework.PropertyHelper.DataSetApi.EntityRecord & IObjectWithKey;

export interface GridProps {
    width?: number;
    height?: number;
    gridHeight: number | null;
    columns: ComponentFramework.PropertyHelper.DataSetApi.Column[];
    records: Record<string, ComponentFramework.PropertyHelper.DataSetApi.EntityRecord>;
    sortedRecordIds: string[];
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    currentPage: number;
    sorting: ComponentFramework.PropertyHelper.DataSetApi.SortStatus[];
    filtering: ComponentFramework.PropertyHelper.DataSetApi.FilterExpression;
    resources: ComponentFramework.Resources;
    itemsLoading: boolean;
    setSelectedRecords: (ids: string[]) => void;
    onNavigate: (item?: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord) => void;
    onSort: (name: string, desc: boolean) => void;
    onFilter: (name: string, filtered: boolean) => void;
    loadFirstPage: () => void;
    loadNextPage: () => void;
    loadPreviousPage: () => void;
    onFullScreen: () => void;
    isFullScreen: boolean;
}

const onRenderDetailsHeader: IRenderFunction<IDetailsHeaderProps> = (props, defaultRender) => {
    if (props && defaultRender) {
        return (
            <Sticky stickyPosition={StickyPositionType.Header} isScrollSynced>
                {defaultRender({
                    ...props,
                    styles: { 
                        root: { 
                            padding: 0 
                        } 
                    },
                })}
            </Sticky>
        );
    }
    return null;
};

const onRenderItemColumn = (
    item?: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord,
    index?: number,
    column?: IColumn,
) => {
    if (column && column.fieldName && item) {
        return <>{item?.getFormattedValue(column.fieldName)}</>;
    }
    return <></>;
};

export const Grid = React.memo((props: GridProps) => {
    const {
        records,
        sortedRecordIds,
        columns,
        width,
        height,
        gridHeight,
        hasNextPage,
        sorting,
        filtering,
        currentPage,
        itemsLoading,
        setSelectedRecords,
        onNavigate,
        onSort,
        onFilter,
        resources,
    } = props;

    console.log(props);

    const forceUpdate = useForceUpdate();
    const onSelectionChanged = React.useCallback(() => {
        const items = selection.getItems() as DataSet[];
        const selected = selection.getSelectedIndices().map((index: number) => {
            const item: DataSet | undefined = items[index];
            return item && items[index].getRecordId();
        });

        setSelectedRecords(selected);
        forceUpdate();
    }, [forceUpdate]);

    const selection: Selection = useConst(() => {
        return new Selection({
            selectionMode: SelectionMode.single,
            onSelectionChanged: onSelectionChanged,
        });
    });

    const [isComponentLoading, setIsLoading] = React.useState<boolean>(false);

    const [contextualMenuProps, setContextualMenuProps] = React.useState<IContextualMenuProps>();

    const onContextualMenuDismissed = React.useCallback(() => {
        setContextualMenuProps(undefined);
    }, [setContextualMenuProps]);

    const getContextualMenuProps = React.useCallback(
        (column: IColumn, ev: React.MouseEvent<HTMLElement>): IContextualMenuProps => {
            const menuItems = [
                {
                    key: 'aToZ',
                    name: resources.getString('Label_SortAZ'),
                    iconProps: { iconName: 'SortUp' },
                    canCheck: true,
                    checked: column.isSorted && !column.isSortedDescending,
                    disable: (column.data as ComponentFramework.PropertyHelper.DataSetApi.Column).disableSorting,
                    onClick: () => {
                        onSort(column.key, false);
                        setContextualMenuProps(undefined);
                        setIsLoading(true);
                    },
                },
                {
                    key: 'zToA',
                    name: resources.getString('Label_SortZA'),
                    iconProps: { iconName: 'SortDown' },
                    canCheck: true,
                    checked: column.isSorted && column.isSortedDescending,
                    disable: (column.data as ComponentFramework.PropertyHelper.DataSetApi.Column).disableSorting,
                    onClick: () => {
                        onSort(column.key, true);
                        setContextualMenuProps(undefined);
                        setIsLoading(true);
                    },
                },
                {
                    key: 'filter',
                    name: resources.getString('Label_DoesNotContainData'),
                    iconProps: { iconName: 'Filter' },
                    canCheck: true,
                    checked: column.isFiltered,
                    onClick: () => {
                        onFilter(column.key, column.isFiltered !== true);
                        setContextualMenuProps(undefined);
                        setIsLoading(true);
                    },
                },
            ];
            return {
                items: menuItems,
                target: ev.currentTarget as HTMLElement,
                directionalHint: DirectionalHint.bottomLeftEdge,
                gapSpace: 10,
                isBeakVisible: true,
                onDismiss: onContextualMenuDismissed,
            };
        },
        [setIsLoading, onFilter, setContextualMenuProps],
    );

    const onColumnContextMenu = React.useCallback(
        (column?: IColumn, ev?: React.MouseEvent<HTMLElement>) => {
            if (column && ev) {
                setContextualMenuProps(getContextualMenuProps(column, ev));
            }
        },
        [getContextualMenuProps, setContextualMenuProps],
    );

    const onColumnClick = React.useCallback(
        (ev: React.MouseEvent<HTMLElement>, column: IColumn) => {
            if (column && ev) {
                setContextualMenuProps(getContextualMenuProps(column, ev));
            }
        },
        [getContextualMenuProps, setContextualMenuProps],
    );

    const items: (DataSet | undefined)[] = React.useMemo(() => {
        setIsLoading(false);

        const sortedRecords: (DataSet | undefined)[] = sortedRecordIds.map((id) => {
            const record = records[id];
            return record;
        });

        return sortedRecords;
    }, [records, sortedRecordIds, hasNextPage, setIsLoading]);

    const gridColumns = React.useMemo(() => {
        return columns
            .filter((col) => !col.isHidden && col.order >= 0)
            .sort((a, b) => a.order - b.order)
            .map((col) => {
                const sortOn = sorting && sorting.find((s) => s.name === col.name);
                const filtered =
                    filtering && filtering.conditions && filtering.conditions.find((f) => f.attributeName == col.name);
                return {
                    key: col.name,
                    name: col.displayName,
                    fieldName: col.name,
                    isSorted: sortOn != null,
                    isSortedDescending: sortOn?.sortDirection === 1,
                    isResizable: true,
                    isFiltered: filtered != null,
                    data: col,
                    minWidth: 50,
                    flexGrow: col.visualSizeFactor ?? 1,
                    targetWidthProportion: col.visualSizeFactor,
                    onColumnContextMenu: onColumnContextMenu,
                    onColumnClick: onColumnClick,
                } as IColumn;
            });
    }, [columns, sorting, onColumnContextMenu, onColumnClick]);

    console.log('height', height);
    console.log('gridHeight', gridHeight);
    console.log('resource', )

    const rootContainerStyle: React.CSSProperties = React.useMemo(() => {
        return {
            height: gridHeight ?? height ?? 420,
            width: width,
            padding: 0
        };
    }, [width, gridHeight]);

    const onRenderRow: IDetailsListProps['onRenderRow'] = (props) => {
        const customStyles: Partial<IDetailsRowStyles> = {};

        if (props && props.item) {
            const item = props.item as DataSet | undefined;

            customStyles.root = {
                fontSize: '14px',
                
            }

            return <DetailsRow {...props} styles={customStyles} />;
        }

        return null;
    };

    const onRenderCheckBox: IRenderFunction<IDetailsCheckboxProps> = (props, defaultRender) => {
        const elem = defaultRender ? defaultRender(props) : null;

        console.log(elem);

        return elem;
    };

    return (
        <Stack verticalFill grow style={rootContainerStyle}>
            <Stack.Item grow style={{ position: 'relative', backgroundColor: 'white', textAlign: 'left', padding: 0 }}>
                <ScrollablePane 
                    scrollbarVisibility={ScrollbarVisibility.auto} 
                    style={{ 
                        padding: 0
                    }}
                    >
                    <DetailsList
                        columns={gridColumns}
                        onRenderItemColumn={onRenderItemColumn}
                        onRenderDetailsHeader={onRenderDetailsHeader}
                        items={items}
                        setKey={`set${currentPage}`} // Ensures that the selection is reset when paging
                        initialFocusedIndex={0}
                        checkButtonAriaLabel="Selectionner ligne"
                        layoutMode={DetailsListLayoutMode.fixedColumns}
                        constrainMode={ConstrainMode.unconstrained}
                        selection={selection}
                        onItemInvoked={onNavigate}
                        onRenderRow={onRenderRow}
                        cellStyleProps={{
                            cellLeftPadding: 0,
                            cellRightPadding: 0,
                            cellExtraRightPadding: 0
                        }}
                        onRenderCheckbox={onRenderCheckBox}
                    ></DetailsList>
                    {contextualMenuProps && <ContextualMenu {...contextualMenuProps} />}
                </ScrollablePane>
                {(itemsLoading || isComponentLoading) && <Overlay />}
            </Stack.Item>
            <Stack.Item style={{ alignContent: 'start', textAlign: 'start' }}>
                <Stack horizontal style={{ width: '100%', alignItems: 'start' }}>
                    <Stack.Item grow align="start" style={{ alignItems: 'start' }}>
                        <Text>Lignes : { items?.length ?? 0 }</Text>
                    </Stack.Item>
                </Stack>
            </Stack.Item>
        </Stack>
    );
});

Grid.displayName = 'Grid';
