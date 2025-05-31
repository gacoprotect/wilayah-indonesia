<?php

namespace Gaco\RegionApiId;

use League\Csv\Reader;
use League\Csv\Statement;

class Generate
{

    private $dataPath;
    private $staticPath;
    private $quiet;

    public function __construct(string $dataPath, string $staticPath, bool $quiet = false)
    {
        $this->dataPath = rtrim($dataPath, '/') . '/';
        $this->staticPath = rtrim($staticPath, '/') . '/';
        $this->quiet = $quiet;
    }
    private function showProgress(int $current, int $total, string $message): void
    {
        if ($this->quiet) {
            return;
        }

        // Pastikan current tidak melebihi total
        $current = min($current, $total);

        // Hitung persentase (0-100)
        $percent = ($current / $total) * 100;
        $percent = min(100, max(0, $percent)); // Clamp antara 0-100

        // Buat progress bar visual
        $barLength = 50;
        $filled = round(($percent / 100) * $barLength);
        $filled = min($barLength, max(0, $filled)); // Pastikan antara 0-50
        $empty = $barLength - $filled;

        // Format output
        $progressBar = sprintf(
            "\r%s: [%s%s] %3d%% (%d/%d)",
            $message,
            str_repeat('=', $filled),
            str_repeat(' ', $empty),
            $percent,
            $current,
            $total
        );

        echo $progressBar;

        // Jika selesai, tambahkan newline
        if ($current === $total) {
            echo PHP_EOL;
        }
    }

    public function generate(): void
    {
        try {
            $this->createDirectories();

            if (!$this->quiet) {
                echo "Generating Indonesia region data...\n";
            }

            $this->generateProvinces();
            $this->generateRegencies();
            $this->generateDistricts();
            $this->generateVillages();

            if (!$this->quiet) {
                echo "Generation completed!\n";
            }
        } catch (\Exception $e) {
            if (!$this->quiet) {
                echo "\nError: " . $e->getMessage() . "\n";
            }
            throw $e;
        }
    }
    private function createDirectories(): void
    {
        $dirs = [
            'provinces',
            'province',
            'regencies',
            'regency',
            'districts',
            'district',
            'villages',
            'village'
        ];

        foreach ($dirs as $dir) {
            $path = $this->staticPath . $dir;
            if (!file_exists($path)) {
                mkdir($path, 0755, true);
            }
        }
    }

    private function generateProvinces(): void
    {
        $csv = Reader::createFromPath($this->dataPath . 'provinces.csv', 'r');
        $csv->setHeaderOffset(null);
        $records = iterator_to_array($csv->getRecords());
        $total = count($records);


        $provinces = [];
        foreach ($records as $index => $record) {
            $province = [
                'id' => $record[0],
                'name' => $record[1]
            ];
            $provinces[] = $province;

            file_put_contents(
                $this->staticPath . 'province/' . $record[0] . '.json',
                json_encode($province, JSON_PRETTY_PRINT)
            );

            $this->showProgress($index + 1, $total, 'Processing provinces');
        }

        file_put_contents(
            $this->staticPath . 'provinces.json',
            json_encode($provinces, JSON_PRETTY_PRINT)
        );
    }

    private function generateRegencies(): void
    {
        $csv = Reader::createFromPath($this->dataPath . 'regencies.csv', 'r');
        $csv->setHeaderOffset(null);
        $records = iterator_to_array($csv->getRecords());
        $total = count($records);

        $regenciesByProvince = [];
        $allRegencies = [];

        // Progress untuk individual regency files
        foreach ($records as $index => $record) {
            $regency = [
                'id' => $record[0],
                'province_id' => $record[1],
                'name' => $record[2]
            ];

            $allRegencies[] = $regency;

            if (!isset($regenciesByProvince[$record[1]])) {
                $regenciesByProvince[$record[1]] = [];
            }
            $regenciesByProvince[$record[1]][] = $regency;

            file_put_contents(
                $this->staticPath . 'regency/' . $record[0] . '.json',
                json_encode($regency, JSON_PRETTY_PRINT)
            );
            $this->showProgress($index + 1, $total, 'Processing regency');
        }

        // Progress untuk grouped regencies by province
        $provinceIds = array_keys($regenciesByProvince);
        $totalProvinces = count($provinceIds);

        foreach ($provinceIds as $i => $provinceId) {
            file_put_contents(
                $this->staticPath . 'regencies/' . $provinceId . '.json',
                json_encode($regenciesByProvince[$provinceId], JSON_PRETTY_PRINT)
            );
            $this->showProgress($i + 1, $totalProvinces, 'Processing regencies by province');
        }

        file_put_contents(
            $this->staticPath . 'regencies.json',
            json_encode($allRegencies, JSON_PRETTY_PRINT)
        );
    }

    private function generateDistricts(): void
    {
        $csv = Reader::createFromPath($this->dataPath . 'districts.csv', 'r');
        $csv->setHeaderOffset(null);
        $records = iterator_to_array($csv->getRecords());
        $total = count($records);

        $districtsByRegency = [];
        $allDistricts = [];

        // Progress untuk individual district files
        foreach ($records as $index => $record) {
            $district = [
                'id' => $record[0],
                'regency_id' => $record[1],
                'name' => $record[2]
            ];

            $allDistricts[] = $district;

            if (!isset($districtsByRegency[$record[1]])) {
                $districtsByRegency[$record[1]] = [];
            }
            $districtsByRegency[$record[1]][] = $district;

            file_put_contents(
                $this->staticPath . 'district/' . $record[0] . '.json',
                json_encode($district, JSON_PRETTY_PRINT)
            );
            $this->showProgress($index + 1, $total, 'Processing district');
        }

        // Progress untuk grouped districts by regency
        $regencyIds = array_keys($districtsByRegency);
        $totalRegencies = count($regencyIds);

        foreach ($regencyIds as $i => $regencyId) {
            file_put_contents(
                $this->staticPath . 'districts/' . $regencyId . '.json',
                json_encode($districtsByRegency[$regencyId], JSON_PRETTY_PRINT)
            );
            $this->showProgress($i + 1, $totalRegencies, 'Processing districts by regency');
        }

        file_put_contents(
            $this->staticPath . 'districts.json',
            json_encode($allDistricts, JSON_PRETTY_PRINT)
        );
    }

    private function generateVillages(): void
    {
        $csv = Reader::createFromPath($this->dataPath . 'villages.csv', 'r');
        $csv->setHeaderOffset(null);
        $records = iterator_to_array($csv->getRecords());
        $total = count($records);

        $villagesByDistrict = [];
        $allVillages = [];

        // Progress untuk individual village files
        foreach ($records as $index => $record) {
            $village = [
                'id' => $record[0],
                'district_id' => $record[1],
                'name' => $record[2]
            ];

            $allVillages[] = $village;

            if (!isset($villagesByDistrict[$record[1]])) {
                $villagesByDistrict[$record[1]] = [];
            }
            $villagesByDistrict[$record[1]][] = $village;

            file_put_contents(
                $this->staticPath . 'village/' . $record[0] . '.json',
                json_encode($village, JSON_PRETTY_PRINT)
            );
            $this->showProgress($index + 1, $total, 'Processing village');
        }

        // Progress untuk grouped villages by district
        $districtIds = array_keys($villagesByDistrict);
        $totalDistricts = count($districtIds);

        foreach ($districtIds as $i => $districtId) {
            file_put_contents(
                $this->staticPath . 'villages/' . $districtId . '.json',
                json_encode($villagesByDistrict[$districtId], JSON_PRETTY_PRINT)
            );
            $this->showProgress($i + 1, $totalDistricts, 'Processing villages by district');
        }

        file_put_contents(
            $this->staticPath . 'villages.json',
            json_encode($allVillages, JSON_PRETTY_PRINT)
        );
    }

    public function clearStaticFiles(): bool
    {
        return self::deleteDirectory($this->staticPath);
    }

    private static function deleteDirectory(string $dir): bool
    {
        if (!file_exists($dir)) {
            return true;
        }

        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            if (is_dir($path)) {
                self::deleteDirectory($path);
            } else {
                unlink($path);
            }
        }

        return rmdir($dir);
    }
}
