import {Avatar, Chip} from "@mui/material";
import {t} from "i18next";

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
                        itemName = item ? item[1].icon + ' ' + t(item[1].labelKey) : null;
                    }

                    return item ? (
                        renderItem?
                        <Chip
                            key={identificator}
                            label={itemName || identificator}
                            size="small"
                            onDelete={() => toggleState(identificator)}
                            avatar={
                                renderItem ? renderItem(item) :'suka'
                            }
                            sx={{ fontSize: '0.75rem' }}
                        />
                            :
                            <Chip
                                key={identificator}
                                label={itemName || identificator}
                                size="small"
                                onDelete={() => toggleState(identificator)}
                                sx={{ fontSize: '0.75rem' }}
                            />
                    ) : null;
                })
            }
        </>
    )
}