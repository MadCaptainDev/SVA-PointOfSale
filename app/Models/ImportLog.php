<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ImportLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'file_name',
        'total_rows',
        'imported',
        'failed',
        'skipped',
        'status',
        'results',
        'error_report_path',
        'is_dry_run',
    ];

    protected $casts = [
        'results'    => 'array',
        'is_dry_run' => 'boolean',
    ];
}
