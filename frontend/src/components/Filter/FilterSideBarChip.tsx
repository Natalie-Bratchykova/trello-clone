import {Avatar, Chip} from "@mui/material";

interface FilterSideBarChipProps {
    options: object[];
    filterOptions: object[];
    toggleState: (id: string) => void;
    renderItem?: (item: any) => React.ReactElement;
}
export  default function FilterSideBarChip ({options, filterOptions,toggleState, renderItem=undefined}:FilterSideBarChipProps){

    console.log(options)
    return (
        <>
            {options.map((identificator) => {
                    let item = filterOptions.find((x) => x.id === identificator);
                    let itemName = item ? item.name : null;
                    if(!item){
                        item = filterOptions.find((x) => x[0] === identificator);
                        itemName = item ? item[1].icon + ' ' + item[1].label : null;
                    }
                    return item ? (
                        <Chip
                            key={identificator}
                            label={itemName || identificator}
                            size="small"
                            onDelete={() => toggleState(identificator)}
                            avatar={
                                renderItem ? renderItem(item) : undefined
                            }
                            sx={{ fontSize: '0.75rem' }}
                        />
                    ) : null;
                })
            }
        </>
    )
}