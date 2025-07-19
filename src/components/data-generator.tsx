"use client";

import { useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as XLSX from 'xlsx';
import Image from 'next/image';

import { formSchema, type FormValues, locales } from '@/lib/schemas';
import { handleGenerateData, handleAnalyzeScreenshot, handleAnalyzeHtml, handleAnalyzeTemplate } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";
import { jsonToXml, jsonToCsv, jsonToSql, jsonToTsv, jsonToYaml } from '@/lib/converters';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { DataTable } from '@/components/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTypeField } from './data-type-field';

import { PlusCircle, Download, Loader2, ChevronDown, FileCode2, Table2, FileText, FileJson, Database, FileSpreadsheet, Sparkles, Upload, FileCode, Link, FileUp } from 'lucide-react';

export function DataGenerator() {
    const [generatedData, setGeneratedData] = useState<Record<string, any>[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const [isAnalyzeDialogOpen, setAnalyzeDialogOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    const [analysisType, setAnalysisType] = useState('screenshot');
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [htmlFileContent, setHtmlFileContent] = useState<string | null>(null);
    const [htmlFileName, setHtmlFileName] = useState<string | null>(null);
    const [urlInput, setUrlInput] = useState('');
    const [templateHeaders, setTemplateHeaders] = useState<string[] | null>(null);
    const [templateFileName, setTemplateFileName] = useState<string | null>(null);


    const screenshotFileInputRef = useRef<HTMLInputElement>(null);
    const htmlFileInputRef = useRef<HTMLInputElement>(null);
    const templateFileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fields: [{ fieldName: 'fullName', dataType: 'FullName' }],
            numberOfRows: 10,
        },
        mode: "onSubmit",
    });

    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: "fields",
    });

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        setGeneratedData(null);
        
        toast({
            title: "Generating Data...",
            description: `AI is creating ${data.numberOfRows} records. Please wait.`,
        });

        const result = await handleGenerateData(data);
        setIsLoading(false);

        if (result.success && result.data) {
            try {
                const parsedData = JSON.parse(result.data);
                setGeneratedData(parsedData);
                 toast({
                    title: "Success!",
                    description: "Your test data has been generated.",
                });
            } catch (e) {
                 toast({
                    variant: "destructive",
                    title: "Parsing Error",
                    description: "The AI returned invalid data. Please try again.",
                });
            }
        } else {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: result.error || "Failed to generate data.",
            });
        }
    };

    const handleScreenshotFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setScreenshotPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleHtmlFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) { // 1MB limit
                toast({
                    variant: "destructive",
                    title: "File Too Large",
                    description: "HTML file size cannot exceed 1MB.",
                });
                if (htmlFileInputRef.current) {
                    htmlFileInputRef.current.value = "";
                }
                setHtmlFileContent(null);
                setHtmlFileName(null);
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setHtmlFileContent(reader.result as string);
                setHtmlFileName(file.name);
            };
            reader.readAsText(file);
        }
    };

    const handleTemplateFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setTemplateFileName(file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = e.target?.result;
                if (data) {
                    try {
                        const workbook = XLSX.read(data, { type: 'array' });
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        if (json.length > 0) {
                            const headers = (json[0] as string[]).filter(h => typeof h === 'string' && h.trim() !== '');
                            if (headers.length > 0) {
                                setTemplateHeaders(headers);
                            } else {
                                toast({ variant: 'destructive', title: 'Error', description: 'Template file appears to have no headers.' });
                            }
                        } else {
                            toast({ variant: 'destructive', title: 'Error', description: 'Template file is empty.' });
                        }
                    } catch (error) {
                        toast({ variant: 'destructive', title: 'File Read Error', description: 'Could not parse the template file. Please ensure it is a valid CSV or Excel file.' });
                    }
                }
            };
            reader.readAsArrayBuffer(file);
        }
    };

    const handleAnalyzeClick = async () => {
        setIsAnalyzing(true);
        let result;

        if (analysisType === 'screenshot') {
            if (!screenshotPreview) {
                toast({ variant: 'destructive', title: 'Error', description: 'Please upload a screenshot.' });
                setIsAnalyzing(false);
                return;
            }
            toast({ title: 'Analyzing screenshot...', description: 'AI is detecting form fields.' });
            result = await handleAnalyzeScreenshot(screenshotPreview);
        } else if (analysisType === 'file') {
            if (!htmlFileContent) {
                toast({ variant: 'destructive', title: 'Error', description: 'Please upload an HTML file.' });
                setIsAnalyzing(false);
                return;
            }
            toast({ title: 'Analyzing HTML file...', description: 'AI is detecting form fields.' });
            result = await handleAnalyzeHtml({ htmlContent: htmlFileContent });
        } else if (analysisType === 'url') {
            if (!urlInput) {
                toast({ variant: 'destructive', title: 'Error', description: 'Please enter a URL.' });
                setIsAnalyzing(false);
                return;
            }
            toast({ title: 'Analyzing URL...', description: 'AI is fetching and detecting form fields.' });
            result = await handleAnalyzeHtml({ url: urlInput });
        } else if (analysisType === 'template') {
            if (!templateHeaders) {
                toast({ variant: 'destructive', title: 'Error', description: 'Please upload a template file.' });
                setIsAnalyzing(false);
                return;
            }
            toast({ title: 'Analyzing template...', description: 'AI is mapping headers to data types.' });
            result = await handleAnalyzeTemplate(templateHeaders);
        }

        setIsAnalyzing(false);

        if (result && result.success && result.data && result.data.length > 0) {
            const formattedData = result.data.map(field => ({ ...field, fieldName: field.fieldName || 'unnamedField' }));
            replace(formattedData);
            setAnalyzeDialogOpen(false);
            toast({ title: 'Success!', description: 'Fields have been populated from your source.' });
        } else {
            toast({ variant: 'destructive', title: 'Analysis Failed', description: result?.error || 'Could not detect any fields. Please check your source and try again.' });
        }
    };

    const onDialogClose = (open: boolean) => {
        if (!open) {
            setScreenshotPreview(null);
            setHtmlFileContent(null);
            setHtmlFileName(null);
            setUrlInput('');
            setTemplateHeaders(null);
            setTemplateFileName(null);
            
            if (screenshotFileInputRef.current) screenshotFileInputRef.current.value = "";
            if (htmlFileInputRef.current) htmlFileInputRef.current.value = "";
            if (templateFileInputRef.current) templateFileInputRef.current.value = "";
            
            setAnalysisType('screenshot');
        }
        setAnalyzeDialogOpen(open);
    }
    
    const isAnalyzeDisabled = isAnalyzing ||
        (analysisType === 'screenshot' && !screenshotPreview) ||
        (analysisType === 'file' && !htmlFileContent) ||
        (analysisType === 'url' && !urlInput) ||
        (analysisType === 'template' && !templateHeaders);

    const downloadFile = (filename: string, content: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const downloadExcel = () => {
        if (!generatedData) return;
        const worksheet = XLSX.utils.json_to_sheet(generatedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
        XLSX.writeFile(workbook, "data.xlsx");
    };

    const isDataAvailable = generatedData && generatedData.length > 0;

    return (
        <div className="container mx-auto pt-4 pb-12 px-4 md:px-6">
            <Card className="w-full max-w-6xl mx-auto shadow-lg border">
                <CardHeader className="text-center">
                    <h1 className="font-headline text-4xl font-semibold text-foreground">Test Data Generator</h1>
                    <CardDescription className="text-lg mt-2 max-w-3xl mx-auto">
                        A professional-grade solution to generate realistic, AI-powered test data for any scenario.
                    </CardDescription>
                    <div className="flex justify-center mt-4">
                        <Button variant="outline" onClick={() => setAnalyzeDialogOpen(true)}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate from Source
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <div className="space-y-2">
                                <div className="grid grid-cols-12 gap-4 px-2 py-1 text-sm font-medium text-muted-foreground">
                                    <div className="col-span-12 sm:col-span-6">Field Name</div>
                                    <div className="col-span-12 sm:col-span-5">Type</div>
                                    <div className="col-span-12 sm:col-span-1"></div>
                                </div>
                                {fields.map((field, index) => (
                                    <DataTypeField
                                        key={field.id}
                                        form={form}
                                        index={index}
                                        remove={remove}
                                        append={append}
                                        isRemoveDisabled={fields.length <= 1}
                                    />
                                ))}
                            </div>
                            
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => append({ fieldName: '', dataType: 'FirstName' })}
                                disabled={fields.length >= 50}
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Field
                            </Button>
                            
                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                                <FormField
                                    control={form.control}
                                    name="numberOfRows"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Number of Rows</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="1" max="10000" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="locale"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Locale</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Default (Global)" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {locales.map((locale) => (
                                                        <SelectItem key={locale} value={locale}>
                                                            {locale}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="md:col-span-2 flex justify-end gap-4">
                                    <Button type="submit" disabled={isLoading} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Generating...
                                            </>
                                        ) : "Generate Data"}
                                    </Button>
                                </div>
                            </div>
                            <FormMessage>{form.formState.errors.fields?.root?.message}</FormMessage>
                        </form>
                    </Form>
                    
                    {isLoading && !isDataAvailable && (
                        <div className="mt-10 animate-in fade-in duration-500">
                             <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg">
                                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                                <p className="text-muted-foreground">Generating your data, please wait...</p>
                            </div>
                        </div>
                    )}

                    {isDataAvailable && (
                        <div className="mt-10 animate-in fade-in duration-500">
                            <Separator className="my-6" />
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-headline font-semibold">Generated Data Preview</h2>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" disabled={!isDataAvailable}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Download
                                            <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onSelect={() => downloadFile('data.json', JSON.stringify(generatedData, null, 2), 'application/json')}>
                                            <FileJson className="mr-2 h-4 w-4" />JSON
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => downloadFile('data.csv', jsonToCsv(JSON.stringify(generatedData)), 'text/csv')}>
                                            <Table2 className="mr-2 h-4 w-4" />CSV
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => downloadFile('data.tsv', jsonToTsv(JSON.stringify(generatedData)), 'text/tab-separated-values')}>
                                            <Table2 className="mr-2 h-4 w-4" />TSV
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => downloadFile('data.xml', jsonToXml(JSON.stringify(generatedData)), 'application/xml')}>
                                            <FileCode2 className="mr-2 h-4 w-4" />XML
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => downloadFile('data.sql', jsonToSql(JSON.stringify(generatedData), 'test_data'), 'application/sql')}>
                                            <Database className="mr-2 h-4 w-4" />SQL
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => downloadFile('data.yaml', jsonToYaml(JSON.stringify(generatedData)), 'application/x-yaml')}>
                                            <FileText className="mr-2 h-4 w-4" />YAML
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={downloadExcel}>
                                            <FileSpreadsheet className="mr-2 h-4 w-4" />Excel (.xlsx)
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <DataTable data={generatedData} />
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isAnalyzeDialogOpen} onOpenChange={onDialogClose}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Generate from a Source</DialogTitle>
                        <DialogDescription>
                           Upload a source and the AI will analyze it to generate fields for you.
                        </DialogDescription>
                    </DialogHeader>
                    <Tabs value={analysisType} onValueChange={setAnalysisType} className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="screenshot"><Sparkles className="mr-2 h-4 w-4" />Screenshot</TabsTrigger>
                            <TabsTrigger value="file"><FileCode className="mr-2 h-4 w-4" />HTML File</TabsTrigger>
                            <TabsTrigger value="template"><FileUp className="mr-2 h-4 w-4" />Template</TabsTrigger>
                            <TabsTrigger value="url"><Link className="mr-2 h-4 w-4" />URL</TabsTrigger>
                        </TabsList>
                        <TabsContent value="screenshot">
                             <div className="py-4 space-y-4">
                                {screenshotPreview ? (
                                    <div className="space-y-4">
                                        <div className="rounded-md overflow-hidden border relative aspect-video">
                                            <Image src={screenshotPreview} alt="Screenshot preview" layout="fill" objectFit="contain" />
                                        </div>
                                        <Button variant="outline" className="w-full" onClick={() => screenshotFileInputRef.current?.click()}>
                                            Change Screenshot
                                        </Button>
                                    </div>
                                ) : (
                                    <div 
                                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted"
                                        onClick={() => screenshotFileInputRef.current?.click()}
                                    >
                                        <Upload className="w-8 h-8 text-muted-foreground" />
                                        <p className="mt-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                                        <p className="text-xs text-muted-foreground">PNG, JPG, or WEBP</p>
                                    </div>
                                )}
                                <Input 
                                    ref={screenshotFileInputRef}
                                    type="file" 
                                    className="hidden" 
                                    accept="image/png, image/jpeg, image/webp"
                                    onChange={handleScreenshotFileChange} 
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="file">
                             <div className="py-4 space-y-4">
                                {htmlFileContent ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-center p-4 text-sm border rounded-md bg-muted">
                                            <FileCode className="w-6 h-6 mr-3 text-muted-foreground" />
                                            <span className="font-medium truncate">{htmlFileName}</span>
                                        </div>
                                        <Button variant="outline" className="w-full" onClick={() => htmlFileInputRef.current?.click()}>
                                            Change HTML File
                                        </Button>
                                    </div>
                                ) : (
                                    <div 
                                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted"
                                        onClick={() => htmlFileInputRef.current?.click()}
                                    >
                                        <Upload className="w-8 h-8 text-muted-foreground" />
                                        <p className="mt-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                                        <p className="text-xs text-muted-foreground">HTML files only</p>
                                    </div>
                                )}
                                <Input 
                                    ref={htmlFileInputRef}
                                    type="file" 
                                    className="hidden" 
                                    accept=".html,.htm"
                                    onChange={handleHtmlFileChange} 
                                />
                            </div>
                        </TabsContent>
                         <TabsContent value="template">
                             <div className="py-4 space-y-4">
                                {templateFileName ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-center p-4 text-sm border rounded-md bg-muted">
                                            <FileUp className="w-6 h-6 mr-3 text-muted-foreground" />
                                            <span className="font-medium truncate">{templateFileName}</span>
                                        </div>
                                        <Button variant="outline" className="w-full" onClick={() => templateFileInputRef.current?.click()}>
                                            Change Template File
                                        </Button>
                                    </div>
                                ) : (
                                    <div 
                                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted"
                                        onClick={() => templateFileInputRef.current?.click()}
                                    >
                                        <Upload className="w-8 h-8 text-muted-foreground" />
                                        <p className="mt-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                                        <p className="text-xs text-muted-foreground">CSV or Excel files (.csv, .xlsx, .xls)</p>
                                    </div>
                                )}
                                <Input 
                                    ref={templateFileInputRef}
                                    type="file" 
                                    className="hidden" 
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleTemplateFileChange} 
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="url">
                            <div className="py-4 space-y-2">
                                <Label htmlFor="url-input">Public URL</Label>
                                <Input 
                                    id="url-input"
                                    placeholder="https://example.com/form.html"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => onDialogClose(false)}>Cancel</Button>
                        <Button onClick={handleAnalyzeClick} disabled={isAnalyzeDisabled}>
                            {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Analyze Source
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
