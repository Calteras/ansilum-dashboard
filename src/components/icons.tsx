import { forwardRef, type SVGProps } from 'react'
import {
  AdjustmentsHorizontalIcon as OutlineAdjustmentsHorizontalIcon,
  ArchiveBoxIcon as OutlineArchiveBoxIcon,
  ArrowDownIcon as OutlineArrowDownIcon,
  ArrowDownTrayIcon as OutlineArrowDownTrayIcon,
  ArrowLeftIcon as OutlineArrowLeftIcon,
  ArrowPathIcon as OutlineArrowPathIcon,
  ArrowRightIcon as OutlineArrowRightIcon,
  ArrowRightEndOnRectangleIcon as OutlineArrowRightEndOnRectangleIcon,
  ArrowRightStartOnRectangleIcon as OutlineArrowRightStartOnRectangleIcon,
  ArrowTopRightOnSquareIcon as OutlineArrowTopRightOnSquareIcon,
  ArrowTrendingDownIcon as OutlineArrowTrendingDownIcon,
  ArrowTrendingUpIcon as OutlineArrowTrendingUpIcon,
  ArrowUpIcon as OutlineArrowUpIcon,
  ArrowUpCircleIcon as OutlineArrowUpCircleIcon,
  ArrowUpTrayIcon as OutlineArrowUpTrayIcon,
  ArrowUturnLeftIcon as OutlineArrowUturnLeftIcon,
  ArrowsPointingOutIcon as OutlineArrowsPointingOutIcon,
  ArrowsRightLeftIcon as OutlineArrowsRightLeftIcon,
  ArrowsUpDownIcon as OutlineArrowsUpDownIcon,
  BanknotesIcon as OutlineBanknotesIcon,
  Bars3Icon as OutlineBars3Icon,
  Bars3BottomLeftIcon as OutlineBars3BottomLeftIcon,
  BeakerIcon as OutlineBeakerIcon,
  BellIcon as OutlineBellIcon,
  BoltIcon as OutlineBoltIcon,
  BookmarkSquareIcon as OutlineBookmarkSquareIcon,
  BuildingOffice2Icon as OutlineBuildingOffice2Icon,
  BuildingStorefrontIcon as OutlineBuildingStorefrontIcon,
  CakeIcon as OutlineCakeIcon,
  CalculatorIcon as OutlineCalculatorIcon,
  CalendarDaysIcon as OutlineCalendarDaysIcon,
  ChartBarIcon as OutlineChartBarIcon,
  ChatBubbleLeftIcon as OutlineChatBubbleLeftIcon,
  ChatBubbleLeftEllipsisIcon as OutlineChatBubbleLeftEllipsisIcon,
  ChatBubbleLeftRightIcon as OutlineChatBubbleLeftRightIcon,
  CheckIcon as OutlineCheckIcon,
  CheckBadgeIcon as OutlineCheckBadgeIcon,
  CheckCircleIcon as OutlineCheckCircleIcon,
  ChevronDoubleLeftIcon as OutlineChevronDoubleLeftIcon,
  ChevronDoubleRightIcon as OutlineChevronDoubleRightIcon,
  ChevronDownIcon as OutlineChevronDownIcon,
  ChevronLeftIcon as OutlineChevronLeftIcon,
  ChevronRightIcon as OutlineChevronRightIcon,
  ChevronUpIcon as OutlineChevronUpIcon,
  ChevronUpDownIcon as OutlineChevronUpDownIcon,
  CircleStackIcon as OutlineCircleStackIcon,
  ClipboardDocumentListIcon as OutlineClipboardDocumentListIcon,
  ClockIcon as OutlineClockIcon,
  Cog6ToothIcon as OutlineCog6ToothIcon,
  CommandLineIcon as OutlineCommandLineIcon,
  ComputerDesktopIcon as OutlineComputerDesktopIcon,
  CreditCardIcon as OutlineCreditCardIcon,
  CubeIcon as OutlineCubeIcon,
  CurrencyDollarIcon as OutlineCurrencyDollarIcon,
  DocumentDuplicateIcon as OutlineDocumentDuplicateIcon,
  DocumentTextIcon as OutlineDocumentTextIcon,
  EllipsisHorizontalIcon as OutlineEllipsisHorizontalIcon,
  EllipsisHorizontalCircleIcon as OutlineEllipsisHorizontalCircleIcon,
  EllipsisVerticalIcon as OutlineEllipsisVerticalIcon,
  EnvelopeIcon as OutlineEnvelopeIcon,
  ExclamationCircleIcon as OutlineExclamationCircleIcon,
  ExclamationTriangleIcon as OutlineExclamationTriangleIcon,
  EyeIcon as OutlineEyeIcon,
  EyeSlashIcon as OutlineEyeSlashIcon,
  FolderIcon as OutlineFolderIcon,
  FunnelIcon as OutlineFunnelIcon,
  GiftIcon as OutlineGiftIcon,
  InboxIcon as OutlineInboxIcon,
  InformationCircleIcon as OutlineInformationCircleIcon,
  KeyIcon as OutlineKeyIcon,
  LanguageIcon as OutlineLanguageIcon,
  LinkIcon as OutlineLinkIcon,
  LockClosedIcon as OutlineLockClosedIcon,
  MagnifyingGlassIcon as OutlineMagnifyingGlassIcon,
  MapPinIcon as OutlineMapPinIcon,
  MinusIcon as OutlineMinusIcon,
  MoonIcon as OutlineMoonIcon,
  NoSymbolIcon as OutlineNoSymbolIcon,
  PaperAirplaneIcon as OutlinePaperAirplaneIcon,
  PaperClipIcon as OutlinePaperClipIcon,
  PencilIcon as OutlinePencilIcon,
  PencilSquareIcon as OutlinePencilSquareIcon,
  PhoneIcon as OutlinePhoneIcon,
  PhotoIcon as OutlinePhotoIcon,
  PlusIcon as OutlinePlusIcon,
  PowerIcon as OutlinePowerIcon,
  PresentationChartLineIcon as OutlinePresentationChartLineIcon,
  QuestionMarkCircleIcon as OutlineQuestionMarkCircleIcon,
  QueueListIcon as OutlineQueueListIcon,
  RadioIcon as OutlineRadioIcon,
  ReceiptPercentIcon as OutlineReceiptPercentIcon,
  RectangleGroupIcon as OutlineRectangleGroupIcon,
  RectangleStackIcon as OutlineRectangleStackIcon,
  ShareIcon as OutlineShareIcon,
  ShieldCheckIcon as OutlineShieldCheckIcon,
  ShoppingBagIcon as OutlineShoppingBagIcon,
  ShoppingCartIcon as OutlineShoppingCartIcon,
  Square3Stack3DIcon as OutlineSquare3Stack3DIcon,
  Squares2X2Icon as OutlineSquares2X2Icon,
  StarIcon as OutlineStarIcon,
  StopIcon as OutlineStopIcon,
  SunIcon as OutlineSunIcon,
  SwatchIcon as OutlineSwatchIcon,
  TableCellsIcon as OutlineTableCellsIcon,
  TagIcon as OutlineTagIcon,
  TrashIcon as OutlineTrashIcon,
  TruckIcon as OutlineTruckIcon,
  UserCircleIcon as OutlineUserCircleIcon,
  UserMinusIcon as OutlineUserMinusIcon,
  UserPlusIcon as OutlineUserPlusIcon,
  UsersIcon as OutlineUsersIcon,
  VideoCameraIcon as OutlineVideoCameraIcon,
  ViewColumnsIcon as OutlineViewColumnsIcon,
  ViewfinderCircleIcon as OutlineViewfinderCircleIcon,
  WrenchScrewdriverIcon as OutlineWrenchScrewdriverIcon,
  XCircleIcon as OutlineXCircleIcon,
  XMarkIcon as OutlineXMarkIcon
} from '@heroicons/react/24/outline'

export type IconProps = SVGProps<SVGSVGElement> & { size?: number | string }
type OutlineIcon = typeof OutlineCheckIcon

/** Heroicons outline, shared 20px size and 1.5px stroke across the app. */
function icon(Outline: OutlineIcon, weight = 1.5) {
  const Component = forwardRef<SVGSVGElement, IconProps>(function Icon(
    { size = 20, strokeWidth = weight, ...props }, ref
  ) {
    return <Outline ref={ref} width={size} height={size} strokeWidth={strokeWidth} {...props} />
  })
  return Component
}

export const Activity = icon(OutlineChartBarIcon)
export const AlertCircle = icon(OutlineExclamationCircleIcon)
export const AlertTriangle = icon(OutlineExclamationTriangleIcon)
export const ArrowDown = icon(OutlineArrowDownIcon)
export const ArrowDownUp = icon(OutlineArrowsUpDownIcon)
export const ArrowLeft = icon(OutlineArrowLeftIcon)
export const ArrowLeftRight = icon(OutlineArrowsRightLeftIcon)
export const ArrowRight = icon(OutlineArrowRightIcon)
export const ArrowRightLeft = icon(OutlineArrowsRightLeftIcon)
export const ArrowUp = icon(OutlineArrowUpIcon)
export const ArrowUpCircle = icon(OutlineArrowUpCircleIcon)
export const ArrowUpDown = icon(OutlineArrowsUpDownIcon)
export const AudioWaveform = icon(OutlineChartBarIcon)
export const BadgeCheck = icon(OutlineCheckBadgeIcon)
export const Banknote = icon(OutlineBanknotesIcon)
export const BarChart2 = icon(OutlineChartBarIcon)
export const BarChart3 = icon(OutlineChartBarIcon)
export const Beaker = icon(OutlineBeakerIcon)
export const Bell = icon(OutlineBellIcon)
export const BetweenVerticalEnd = icon(OutlineViewColumnsIcon)
export const Bike = icon(OutlineTruckIcon)
export const Building2 = icon(OutlineBuildingOffice2Icon)
export const Calculator = icon(OutlineCalculatorIcon)
export const Calendar = icon(OutlineCalendarDaysIcon)
export const CalendarCheck = icon(OutlineCalendarDaysIcon)
export const CalendarIcon = icon(OutlineCalendarDaysIcon)
export const ChartBar = icon(OutlineChartBarIcon)
export const ChartLine = icon(OutlinePresentationChartLineIcon)
export const ChartNoAxesCombined = icon(OutlinePresentationChartLineIcon)
export const Check = icon(OutlineCheckIcon, 2.5)
export const CheckCircle = icon(OutlineCheckCircleIcon)
export const CheckCircle2 = icon(OutlineCheckCircleIcon)
export const CheckIcon = icon(OutlineCheckIcon, 2.5)
export const ChefHat = icon(OutlineCakeIcon)
export const ChevronDown = icon(OutlineChevronDownIcon)
export const ChevronDownIcon = icon(OutlineChevronDownIcon)
export const ChevronLeft = icon(OutlineChevronLeftIcon)
export const ChevronLeftIcon = icon(OutlineChevronLeftIcon)
export const ChevronRight = icon(OutlineChevronRightIcon)
export const ChevronRightIcon = icon(OutlineChevronRightIcon)
export const ChevronUpIcon = icon(OutlineChevronUpIcon)
export const ChevronsLeft = icon(OutlineChevronDoubleLeftIcon)
export const ChevronsRight = icon(OutlineChevronDoubleRightIcon)
export const ChevronsUpDown = icon(OutlineChevronUpDownIcon)
export const Circle = icon(OutlineEllipsisHorizontalCircleIcon)
export const CircleArrowUp = icon(OutlineArrowUpCircleIcon)
export const CircleCheck = icon(OutlineCheckCircleIcon)
export const CircleDashed = icon(OutlineClockIcon)
export const CircleDot = icon(OutlineRadioIcon)
export const CircleIcon = icon(OutlineEllipsisHorizontalCircleIcon)
export const CircleOff = icon(OutlineNoSymbolIcon)
export const CircleQuestionMark = icon(OutlineQuestionMarkCircleIcon)
export const ClipboardList = icon(OutlineClipboardDocumentListIcon)
export const Clock = icon(OutlineClockIcon)
export const Clock3 = icon(OutlineClockIcon)
export const Coffee = icon(OutlineBeakerIcon)
export const Coins = icon(OutlineBanknotesIcon)
export const Command = icon(OutlineCommandLineIcon)
export const Copy = icon(OutlineDocumentDuplicateIcon)
export const CreditCard = icon(OutlineCreditCardIcon)
export const Crown = icon(OutlineBuildingOffice2Icon)
export const Database = icon(OutlineCircleStackIcon)
export const DollarSign = icon(OutlineCurrencyDollarIcon)
export const Download = icon(OutlineArrowDownTrayIcon)
export const Edit = icon(OutlinePencilSquareIcon)
export const Edit2 = icon(OutlinePencilSquareIcon)
export const ExternalLink = icon(OutlineArrowTopRightOnSquareIcon)
export const Eye = icon(OutlineEyeIcon)
export const EyeOff = icon(OutlineEyeSlashIcon)
export const FileDown = icon(OutlineArrowDownTrayIcon)
export const FileInput = icon(OutlineArrowUpTrayIcon)
export const FileSpreadsheet = icon(OutlineTableCellsIcon)
export const FileText = icon(OutlineDocumentTextIcon)
export const Filter = icon(OutlineFunnelIcon)
export const FlaskConical = icon(OutlineBeakerIcon)
export const Folder = icon(OutlineFolderIcon)
export const GalleryVerticalEnd = icon(OutlineRectangleStackIcon)
export const Gift = icon(OutlineGiftIcon)
export const Grid3X3 = icon(OutlineTableCellsIcon)
export const HelpCircle = icon(OutlineQuestionMarkCircleIcon)
export const ImagePlus = icon(OutlinePhotoIcon)
export const Inbox = icon(OutlineInboxIcon)
export const Infinity = icon(OutlineArrowPathIcon)
export const Info = icon(OutlineInformationCircleIcon)
export const Key = icon(OutlineKeyIcon)
export const Languages = icon(OutlineLanguageIcon)
export const Laptop = icon(OutlineComputerDesktopIcon)
export const Layers = icon(OutlineSquare3Stack3DIcon)
export const LayoutDashboard = icon(OutlineSquares2X2Icon)
export const LayoutGrid = icon(OutlineSquares2X2Icon)
export const LineChartIcon = icon(OutlinePresentationChartLineIcon)
export const ListPlus = icon(OutlineQueueListIcon)
export const Loader = icon(OutlineArrowPathIcon)
export const Loader2 = icon(OutlineArrowPathIcon)
export const Lock = icon(OutlineLockClosedIcon)
export const LogIn = icon(OutlineArrowRightEndOnRectangleIcon)
export const LogOut = icon(OutlineArrowRightStartOnRectangleIcon)
export const Mail = icon(OutlineEnvelopeIcon)
export const MailPlus = icon(OutlineEnvelopeIcon)
export const MapPin = icon(OutlineMapPinIcon)
export const Maximize2 = icon(OutlineArrowsPointingOutIcon)
export const Menu = icon(OutlineBars3Icon)
export const MessageCircle = icon(OutlineChatBubbleLeftIcon)
export const MessagesSquare = icon(OutlineChatBubbleLeftRightIcon)
export const Minus = icon(OutlineMinusIcon)
export const MinusIcon = icon(OutlineMinusIcon)
export const Monitor = icon(OutlineComputerDesktopIcon)
export const Moon = icon(OutlineMoonIcon)
export const MoreHorizontal = icon(OutlineEllipsisHorizontalIcon)
export const MoreVertical = icon(OutlineEllipsisVerticalIcon)
export const Package = icon(OutlineCubeIcon)
export const PackageCheck = icon(OutlineArchiveBoxIcon)
export const Palette = icon(OutlineSwatchIcon)
export const PanelLeftIcon = icon(OutlineBars3BottomLeftIcon)
export const Paperclip = icon(OutlinePaperClipIcon)
export const Pencil = icon(OutlinePencilIcon)
export const Percent = icon(OutlineReceiptPercentIcon)
export const Phone = icon(OutlinePhoneIcon)
export const Plug = icon(OutlineLinkIcon)
export const Plus = icon(OutlinePlusIcon)
export const PowerOff = icon(OutlinePowerIcon)
export const Receipt = icon(OutlineReceiptPercentIcon)
export const RectangleHorizontal = icon(OutlineRectangleGroupIcon)
export const RefreshCw = icon(OutlineArrowPathIcon)
export const RotateCcw = icon(OutlineArrowUturnLeftIcon)
export const Save = icon(OutlineBookmarkSquareIcon)
export const Search = icon(OutlineMagnifyingGlassIcon)
export const SearchIcon = icon(OutlineMagnifyingGlassIcon)
export const Send = icon(OutlinePaperAirplaneIcon)
export const Settings = icon(OutlineCog6ToothIcon)
export const Settings2 = icon(OutlineAdjustmentsHorizontalIcon)
export const Share2 = icon(OutlineShareIcon)
export const Shield = icon(OutlineShieldCheckIcon)
export const ShoppingBag = icon(OutlineShoppingBagIcon)
export const ShoppingCart = icon(OutlineShoppingCartIcon)
export const SlidersHorizontal = icon(OutlineAdjustmentsHorizontalIcon)
export const Sparkles = icon(OutlineChatBubbleLeftEllipsisIcon)
export const Square = icon(OutlineStopIcon)
export const SquareTerminal = icon(OutlineCommandLineIcon)
export const Star = icon(OutlineStarIcon)
export const Store = icon(OutlineBuildingStorefrontIcon)
export const Sun = icon(OutlineSunIcon)
export const Tag = icon(OutlineTagIcon)
export const Tags = icon(OutlineTagIcon)
export const Target = icon(OutlineViewfinderCircleIcon)
export const Telescope = icon(OutlineEyeIcon)
export const Timer = icon(OutlineClockIcon)
export const Trash2 = icon(OutlineTrashIcon)
export const TrendingDown = icon(OutlineArrowTrendingDownIcon)
export const TrendingUp = icon(OutlineArrowTrendingUpIcon)
export const Upload = icon(OutlineArrowUpTrayIcon)
export const UserCheck = icon(OutlineUserCircleIcon)
export const UserCog = icon(OutlineUserCircleIcon)
export const UserPen = icon(OutlineUserCircleIcon)
export const UserPlus = icon(OutlineUserPlusIcon)
export const UserX = icon(OutlineUserMinusIcon)
export const Users = icon(OutlineUsersIcon)
export const UtensilsCrossed = icon(OutlineCakeIcon)
export const Video = icon(OutlineVideoCameraIcon)
export const Warehouse = icon(OutlineArchiveBoxIcon)
export const Wrench = icon(OutlineWrenchScrewdriverIcon)
export const X = icon(OutlineXMarkIcon)
export const XCircle = icon(OutlineXCircleIcon)
export const XIcon = icon(OutlineXMarkIcon)
export const Zap = icon(OutlineBoltIcon)
