"use client";

import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Trash2, ChevronsUpDown, Check, Copy } from 'lucide-react';
import { dataTypeGroups, dateFormats } from '@/lib/schemas';
import type { FormValues } from '@/lib/schemas';

interface DataTypeFieldProps {
    form: UseFormReturn<FormValues>;
    index: number;
    remove: (index?: number | number[]) => void;
    append: (value: any, options?: any) => void;
    isRemoveDisabled: boolean;
}

const emailDomains = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'example.com',
];

const isDateType = (dataType?: string) => {
    if (!dataType) return false;
    const dateDataTypes = ['Date', 'DateTime', 'DateOfBirth', 'Time', 'Timestamp'];
    return dateDataTypes.includes(dataType);
};

export function DataTypeField({ form, index, remove, append, isRemoveDisabled }: DataTypeFieldProps) {
    const [open, setOpen] = useState(false);
    const [emailPopoverOpen, setEmailPopoverOpen] = useState(false);
    const [dateFormatPopoverOpen, setDateFormatPopoverOpen] = useState(false);
    
    const dataType = form.watch(`fields.${index}.dataType`);
    const formatDisplayName = (value: string) => value.replace(/([A-Z])/g, ' $1').trim();
    
    const handleDuplicate = () => {
        const fieldToDuplicate = form.getValues(`fields.${index}`);
        append(fieldToDuplicate);
    };

    const handleSelectDataType = (type: any) => {
        const currentFieldName = form.getValues(`fields.${index}.fieldName`);
        form.setValue(`fields.${index}.dataType`, type);
        setOpen(false);

        // Auto-name field if empty
        if (!currentFieldName) {
            // Convert PascalCase to camelCase for field name
            const newFieldName = type.charAt(0).toLowerCase() + type.slice(1);
            form.setValue(`fields.${index}.fieldName`, newFieldName);
        }

        // Auto-fill some options
        if (isDateType(type) && !form.getValues(`fields.${index}.dateFormat`)) {
            // Provide sensible defaults depending on the data type selected
            const defaultFormat = type === 'Timestamp' || type === 'DateTime' ? 'MM/DD/YYYY HH:mm:ss' :
                                  type === 'Time' ? 'HH:mm:ss' :
                                  'MM/DD/YYYY';
            form.setValue(`fields.${index}.dateFormat`, defaultFormat);
        }
    };
    
    const showOptions = dataType === 'EmailAddress' || isDateType(dataType);

    return (
        <div className="grid grid-cols-12 items-start gap-4 p-4 border rounded-lg bg-card transition-all">
            <div className="col-span-12 sm:col-span-6">
                <FormField
                    control={form.control}
                    name={`fields.${index}.fieldName`}
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input placeholder="e.g., user_email" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div className="col-span-12 sm:col-span-5">
                 <div className={cn("grid grid-cols-1 gap-2 items-start", showOptions && 'sm:grid-cols-2')}>
                    <FormField
                        control={form.control}
                        name={`fields.${index}.dataType`}
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    "w-full justify-between",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                <span className="truncate">
                                                    {field.value
                                                        ? formatDisplayName(field.value)
                                                        : "Select a data type"}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search type..." />
                                            <CommandList>
                                                <CommandEmpty>No type found.</CommandEmpty>
                                                {Object.entries(dataTypeGroups).map(([groupName, types]) => (
                                                    <CommandGroup key={groupName} heading={groupName}>
                                                        {types.map((type) => (
                                                            <CommandItem
                                                                value={type}
                                                                key={type}
                                                                onSelect={() => handleSelectDataType(type)}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        type === field.value
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                {formatDisplayName(type)}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                ))}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {dataType === 'EmailAddress' && (
                        <FormField
                            control={form.control}
                            name={`fields.${index}.emailDomain`}
                            render={({ field }) => (
                                <FormItem>
                                    <Popover open={emailPopoverOpen} onOpenChange={setEmailPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className={cn(
                                                        "w-full justify-between font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                     <span className="truncate">
                                                        {field.value || "Select a domain"}
                                                    </span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                                <CommandInput
                                                    placeholder="Or type custom..."
                                                    value={field.value ?? ''}
                                                    onInput={(e) => field.onChange(e.currentTarget.value)}
                                                />
                                                <CommandList>
                                                    <CommandEmpty>No domain found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {emailDomains.map((domain) => (
                                                            <CommandItem
                                                                value={domain}
                                                                key={domain}
                                                                onSelect={() => {
                                                                    field.onChange(domain);
                                                                    setEmailPopoverOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        domain === field.value ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {domain}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                    {isDateType(dataType) && (
                        <FormField
                            control={form.control}
                            name={`fields.${index}.dateFormat`}
                            render={({ field }) => (
                                <FormItem>
                                    <Popover open={dateFormatPopoverOpen} onOpenChange={setDateFormatPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className={cn(
                                                        "w-full justify-between font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                     <span className="truncate">
                                                        {field.value || "Select a format"}
                                                    </span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search format..." />
                                                <CommandList>
                                                    <CommandEmpty>No format found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {dateFormats.map((format) => (
                                                            <CommandItem
                                                                value={format}
                                                                key={format}
                                                                onSelect={() => {
                                                                    field.onChange(format);
                                                                    setDateFormatPopoverOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        format === field.value ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {format}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                 </div>
            </div>
            <div className="col-span-12 sm:col-span-1 flex justify-end h-10 items-center gap-1">
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleDuplicate}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                >
                    <Copy className="h-5 w-5" />
                    <span className="sr-only">Duplicate field</span>
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={isRemoveDisabled}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                >
                    <Trash2 className="h-5 w-5" />
                    <span className="sr-only">Remove field</span>
                </Button>
            </div>
        </div>
    );
}
